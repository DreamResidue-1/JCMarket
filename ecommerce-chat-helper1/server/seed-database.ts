import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { MongoClient } from 'mongodb';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { z } from 'zod';

import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.7,
  apiKey: process.env.GOOGLE_API_KEY
});

const itemSchema = z.object({
  item_id: z.string(),
  item_name: z.string(),
  item_description: z.string(),
  brand: z.string(),
  manufacturer_address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string()
  }),
  price: z.object({
    full_price: z.number(),
    sale_price: z.number(),
  }),
  categories: z.array(z.string()),
  user_reviews: z.array(z.object({
    review_date: z.string(),
    rating: z.number(),
    comment: z.string(),
  })),
  notes: z.string()
});

type Item = z.infer<typeof itemSchema>;

const parser = StructuredOutputParser.fromZodSchema(z.array(itemSchema));

async function setupDatabaseAndCollection(): Promise<void> {
  console.log('Setting up database and collection...');

  const db = client.db('inventory_database');

  const collections = await db.listCollections({ name: "items" }).toArray();

  if (collections.length === 0) {
    await db.createCollection("items");
    console.log("Created 'items' collection");
  } else {
    console.log("'items' collection already exists");
  }
}

async function createVectorSearchIndex(): Promise<void> {
  try {
    const db = client.db("inventory_database");
    const collection = db.collection('items');

    await collection.dropIndexes();

    const vectorSearchIdx = {
      name: "vector_index",
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: 768,
            similarity: "cosine"
          }
        ]
      }
    };

    console.log('Creating vector search index...');
    await collection.createSearchIndex(vectorSearchIdx);

    console.log('Vector index created');
  } catch (error) {
    console.error('Failed to create vector index:', error);
  }
}

async function generateSyntheticData(): Promise<Item[]> {
  const prompt = `Generate 10 furniture store items.

Each item must include:
item_id, item_name, item_description, brand,
manufacturer_address, price, categories,
user_reviews, notes.

Ensure realistic data.

${parser.getFormatInstructions()}
`;

  console.log("Generating synthetic data...");

  const response = await llm.invoke(prompt);

  return parser.parse(response.content as string);
}

async function createItemSummary(item: Item): Promise<string> {
  const manufacturerDetails = `Made in ${item.manufacturer_address.country}`;
  const categories = item.categories.join(', ');
  const userReview = item.user_reviews.map(
    r => `Rated ${r.rating} on ${r.review_date}: ${r.comment}`
  ).join(" ");

  return `
${item.item_name} ${item.item_description}
Brand: ${item.brand}.
Manufacturer: ${manufacturerDetails}.
Categories: ${categories}.
Reviews: ${userReview}.
Price: Full ${item.price.full_price} USD, Sale ${item.price.sale_price} USD.
Notes: ${item.notes}.
`;
}

async function seedDatabase(): Promise<void> {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    console.log("Connected to MongoDB");

    await setupDatabaseAndCollection();
    await createVectorSearchIndex();

    const db = client.db("inventory_database");
    const collection = db.collection("items");

    await collection.deleteMany({});
    console.log("Cleared old data");

    const syntheticData = await generateSyntheticData();

    const records = await Promise.all(
      syntheticData.map(async (item) => ({
        pageContent: await createItemSummary(item),
        metadata: item
      }))
    );

    for (const record of records) {
      await MongoDBAtlasVectorSearch.fromDocuments(
        [record],
        new GoogleGenerativeAIEmbeddings({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: "text-embedding-004"
        }),
        {
          collection: collection as any,
          indexName: 'vector_index',
          textKey: 'pageContent',
          embeddingKey: 'embedding'
        }
      );

      console.log(`Saved record: ${record.metadata.item_id}`);
    }

    console.log("Seeding complete");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

seedDatabase().catch(console.error);

// import {ChatGoogleGenerativeAI
//   , GoogleGenerativeAIEmbeddings} from '@langchain/google-genai'

// import { StructuredOutputParser } from '@langchain/core/output_parsers'  
// import { MongoClient }from 'mongodb'
// import {MongoDBAtlasVectorSearch }from '@langchain/mongodb';
// import {array, z} from 'zod';

// import "dotenv/config";
// import { it } from 'node:test';

// const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);
// const llm  = new ChatGoogleGenerativeAI({
//   model: "gemini-1.5-flash",
//   temperature: 0.7,
//   apiKey: process.env.GOOGLE_API_KEY
// })

// const itemSchema = z.object({
//   item_id: z.string(),
//   item_name: z.string(),
//   item_description: z.string(),
//   brand: z.string(),
//   manufacturer_address: z.object({
//       street: z.string(),
//       city: z.string() , 
//       state: z.string(), 
//       postal_code: z.string(),
//       country: z.string()
//   }),
//   price: z.object({
//       full_price: z.number(),
//       sale_price: z.number(),
//   }), 
//   categories: z.array(z.string()), 
//       user_reviews: z.array(z.object({
//            review_date: z.string(),
//            rating: z.number(),
//            comment: z.string(),

//       })
//    ), 
//    notes: z.string()

// })

// type Item = z.infer<typeof itemSchema>

// const parser = StructuredOutputParser.fromZodSchema(z.array(itemSchema))


// async function setupDatebaseAndCollection(): Promise<void> {
//    console.log('Setting up datebase and collection...')
   
//      const db =client.db('inventory_database')
//      const collections = await db.listCollections({
//        name: "items"
//      }).toArray()


//      if(collections.length === 0){
//       await db.createCollection("items");
//       console.log("Created 'items' collection in 'inventory_database' database");
//      }else{
//       console.log("'items' collection already exists in 'inventory_database' database");
//      }
//   }



// async function createVectorSearchIndex(): Promise<void> {
//   try {
//     const db= client.db("inventory_database");
//     const collection = db.collection('items')
//     await collection.dropIndexes();
//     const vectorSearchIdx = {
//          name: "vector_index",
//          type: "vectorSearch",
//          definition: {
//               "field":[{
//                 "type": "vector", 
//                 "path": "embedding",
//                 "numDimensions": 768,
//                 "similarity": "cosine"
                
//               }]
//          }
//     }

//     console.log('Creating vector search index...')
//     await collection.createSearchIndex(vectorSearchIdx);
//     console.log('Successfully create vector search index')
//   } catch(error){
//     console.error('Fails to creat vector search index: ',error);
//   }
// }


// async function generateSyntheticDate(): Promise<Item[]> {
//   const prompt = `You are a helpful assistant that generates furniture
//   store item date. Generate 10 furniture store items. Each record should 
//   include the following fields: item_id, item_name, item_description, 
//   brand, namufacturer_address, prices, categories, user_reviews, notes.
//   Ensure variety in the data and realistic values.
  
//   ${parser.getFormatInstructions()}
//   `
//   console.log("Generating synthetic data...");

//   const response = await llm.invoke(prompt);

//   return parser.parse(response.content  as string)
// }


// async function createItemSummary(item : Item): Promise<string>{
//   return new Promise((resolve) => {
//      const manufacturerDetails = `Made in ${item.manufacturer_address.country}`
//      const categories = item.categories.join(', ')
//      const userReview = item.user_reviews.map(
//       review =>  `Rated ${review.rating} on ${review.review_date}: ${review.comment}`  
//     ).join(" ")

//     const basicInfo = `${item.item_name} ${item.item_description} 
//     from the brand ${item.brand}`
//     const price = `At full price it costs: ${item.price.full_price} USD,
//     On sale it costs: ${item.price.sale_price} USD `
//     const notes = item.notes;


//     const summary = `${basicInfo}. Manufacturer: ${manufacturerDetails}.
//     Categories: ${categories}. Reviews: ${userReview}. 
//     Price; ${price}. Notes: ${notes}. `

//     resolve(summary);
//   })
// }

// async function seedDatebase(): Promise<void> {
//   try {
//     await client.connect();
//     await client.db("admin").command({ping: 1})
//     console.log("You successfully connect to MongoDB ")
    
//     await setupDatebaseAndCollection();
//     await createVectorSearchIndex();

//     const db = client.db("inventory_database");
//     const collection = db.collection("items");

//     await collection.deleteMany({})
//     console.log("Clear existing data from items collection")

//     const syntheticData = await generateSyntheticDate();
//     const recordsWithSummaries = await Promise.all(
//       syntheticData.map(async (record) => ({
//          pageContent: await createItemSummary(record),
//          metadate: {...record}
//       }))
//     )
      
//     for(const record of recordsWithSummaries){
//       await MongoDBAtlasVectorSearch.fromDocuments(
//        [record],
//        new GoogleGenerativeAIEmbeddings({
//           apiKey: process.env.GOOGLE_API_KEY,
//           modelName: "text-embedding-004"
//        }) 
//        ,{
//         collection,
//         indexName: 'vector_index',
//         textKey: 'embedding_text',
//         embeddingKey: 'embedding'
//        }
//       )
      
//       console.log("Successfully processed $ saved record: ", record.metadate.item_id)
//     }

//   console.log("Database seeding completely")  
     
//   }catch(error){
//     console.error("Error seeding the database: ", error)
//   }finally{
//     await client.close();
//   }
// }


// seedDatebase().catch(console.error)



// ... inside seedDatabase function
// import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
// import { StructuredOutputParser } from '@langchain/core/output_parsers';
// import { MongoClient } from 'mongodb';
// import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
// import { z } from 'zod';
// import "dotenv/config";

// const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);
// const llm = new ChatGoogleGenerativeAI({
//   model: "gemini-2.5-flash",
//   temperature: 0.7,
//   apiKey: process.env.GOOGLE_API_KEY
// });

// // 1. Fixed Schema
// const itemSchema = z.object({
//   item_id: z.string(),
//   item_name: z.string(),
//   item_description: z.string(),
//   brand: z.string(),
//   manufacturer_address: z.object({
//     street: z.string(),
//     city: z.string(),
//     state: z.string(),
//     postal_code: z.string(),
//     country: z.string()
//   }),
//   price: z.object({
//     full_price: z.number(),
//     sale_price: z.number(),
//   }),
//   categories: z.array(z.string()),
//   user_reviews: z.array(z.object({
//     review_date: z.string(),
//     rating: z.number(),
//     comment: z.string(),
//   })),
//   notes: z.string()
// });


// type Item = z.infer<typeof itemSchema>;
// const parser = StructuredOutputParser.fromZodSchema(z.array(itemSchema));

// async function setupDatabaseAndCollection() {
//   const db = client.db('inventory_database');
//   const collections = await db.listCollections({ name: "items" }).toArray();

//   if (collections.length === 0) {
//     await db.createCollection("items");
//     console.log("Created 'items' collection.");
//   }
// }

// async function createVectorSearchIndex(): Promise<void> {
//   try {
//     const collection = client.db("inventory_database").collection('items');
    
//     // Corrected Atlas Vector Search Index Definition
//     const vectorSearchIdx = {
//       name: "vector_index",
//       type: "vectorSearch",
//       definition: {
//         "fields": [
//           {
//             "type": "vector",
//             "path": "embedding", // This matches your embeddingKey below
//             "numDimensions": 768,
//             "similarity": "cosine"
//           }
//         ]
//       }
//     };
   

//     console.log('Creating vector search index...');
//     await collection.createSearchIndex(vectorSearchIdx);
//     // Note: Search indexes take a few minutes to build in Atlas.
//   } catch (error) {
//     console.error('Failed to create vector search index:', error);
//   }
// }

// async function generateSyntheticData(): Promise<Item[]> {
//   // Corrected typos in the prompt to match Zod schema
//   const prompt = `You are a helpful assistant that generates furniture store items. 
//   Generate 10 furniture store items. Each record MUST follow the schema strictly.
  
//   ${parser.getFormatInstructions()}`;
  
//   console.log("Generating synthetic data...");
//   const response = await llm.invoke(prompt);
//   return parser.parse(response.content as string);
// }

// // Simplified summary function
// async function createItemSummary(item: Item): Promise<string> {
//   const manufacturerDetails = `Made in ${item.manufacturer_address.country}`;
//   const categories = item.categories.join(', ');
//   const userReview = item.user_reviews.map(r => `[${r.rating}/5]: ${r.comment}`).join(" ");

//   return `${item.item_name}. Brand: ${item.brand}. Description: ${item.item_description}. 
//   Manufacturer: ${manufacturerDetails}. Categories: ${categories}. 
//   Reviews: ${userReview}. Price: ${item.price.sale_price} USD. Notes: ${item.notes}.`;
// }

// async function seedDatabase(): Promise<void> {
//   try {
//     await client.connect();
//     console.log("Connected to MongoDB");
    
//     await setupDatabaseAndCollection();
//     await createVectorSearchIndex();
    
//     //const collection = client.db("inventory_database").collection("items") as unknown as Collection;
//     const collection = client.db("inventory_database").collection("items");
//     await collection.deleteMany({});

//     const syntheticData = await generateSyntheticData();
    
//     // Create Documents for LangChain
//     const docs = await Promise.all(
//       syntheticData.map(async (item) => ({
//         pageContent: await createItemSummary(item),
//         metadata: item // Use 'metadata' (correct spelling)
//       }))
//     );

//     console.log("Embedding and saving documents...");
    
//     // Process all at once for efficiency
//     await MongoDBAtlasVectorSearch.fromDocuments(
//       docs,
//       new GoogleGenerativeAIEmbeddings({
//         apiKey: process.env.GOOGLE_API_KEY,
//         modelName: "text-embedding-004"
//       }),
//       {
//         collection: collection as any, //this is an error
//         indexName: 'vector_index',
//         textKey: 'embedding_text', // The text used for the embedding
//         embeddingKey: 'embedding'  // The field where the vector will live
//       }
//     );

//     console.log("Database seeding complete!");
//   } catch (error) {
//     console.error("Error seeding the database:", error);
//   } finally {
//     await client.close();
//   }
// }

// seedDatabase().catch(console.error);