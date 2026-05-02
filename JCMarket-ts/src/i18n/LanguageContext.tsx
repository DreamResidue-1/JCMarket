import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react';

type Language = 'en' | 'ar';
type TranslationParams = Record<string, string | number>;
type TranslationValue = string | ((params: TranslationParams) => string);

type LanguageContextValue = {
  isArabic: boolean;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
};

const LANGUAGE_STORAGE_KEY = 'jcmarket-language';

const translations: Record<Language, Record<string, TranslationValue>> = {
  en: {
    addToCart: 'Add to Cart',
    added: 'Added',
    admin: 'Admin',
    alreadyHaveAccount: 'Already have an account?',
    arabic: 'Arabic',
    arrivingOn: 'Arriving on',
    backToSignIn: 'Back to sign in',
    cart: 'Cart',
    checkout: 'Checkout',
    chooseProfileImage: 'Choose profile image',
    closeMenu: 'Close menu',
    confirmPassword: 'Confirm password',
    createAccount: 'Create account',
    createYourAccount: 'Create your account',
    creatingAccount: 'Creating account...',
    delivered: 'Delivered',
    deliveredOn: 'Delivered on',
    developmentResetCode: 'Development reset code:',
    email: 'Email',
    english: 'English',
    failedToLoadProducts: 'Failed to load products.',
    forgotCopy:
      'Request a reset code, then confirm it here with your new password. Use the same email you signed up with. Google-only accounts do not use password reset codes.',
    forgotPassword: 'Forgot password?',
    hide: 'Hide',
    itemCount: ({ count }) => `${count} ${Number(count) === 1 ? 'item' : 'items'}`,
    joinJCMarket: 'Join JCMarket',
    language: 'Language',
    loginCopy: 'Use your email and password, or continue with Google below.',
    loginCorner: 'Login corner',
    logout: 'Logout',
    menu: 'Menu',
    myAccount: 'My account',
    name: 'Name',
    newHere: 'New here?',
    newMember: 'New member',
    newPassword: 'New password',
    noProductsAvailable: 'No products are available right now.',
    noProductsMatched: ({ search }) =>
      `No products matched "${search}". Try a broader term or a simpler spelling.`,
    openMenu: 'Open menu',
    orContinueWith: 'Or continue with',
    orderId: 'Order ID',
    orderPlaced: 'Order Placed',
    orders: 'Orders',
    ordersPageTitle: 'Your Orders',
    password: 'Password',
    passwordRecovery: 'Password Recovery',
    passwordsDoNotMatch: 'Passwords do not match.',
    preparing: 'Preparing',
    profileImage: 'Profile image',
    profileImageHelp: 'Click the camera icon to upload your picture.',
    profileImageUpdated: 'Message from JCMarket: Your profile image was updated.',
    quantity: 'Quantity',
    registerCopy: 'Create your account and start shopping with JCMarket.',
    resetCode: 'Reset code',
    resetCodeEmailSent:
      'JCMarket sent the reset code from the backend to the email address you entered.',
    resetPassword: 'Reset password',
    search: 'Search',
    searchPlaceholder: 'Search',
    shipped: 'Shipped',
    show: 'Show',
    signIn: 'Sign In',
    signInTitle: 'Sign in',
    signingIn: 'Signing in...',
    sendResetCode: 'Send Reset Code',
    sendingCode: 'Sending code...',
    startOver: 'Start Over',
    total: 'Total',
    trackPackage: 'Track package',
    updatePassword: 'Update Password',
    updateProfileImage: 'Update profile image',
    updatingPassword: 'Updating password...',
    updatingProfileImage: 'Updating profile image...',
    viewAllOrders: 'View all orders',
    welcomeBack: 'Welcome Back',
    yourAccount: 'Your account'
  },
  ar: {
    addToCart: 'أضف إلى السلة',
    added: 'تمت الإضافة',
    admin: 'الإدارة',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    arabic: 'العربية',
    arrivingOn: 'يصل في',
    backToSignIn: 'العودة إلى تسجيل الدخول',
    cart: 'السلة',
    checkout: 'الدفع',
    chooseProfileImage: 'اختر صورة الملف الشخصي',
    closeMenu: 'إغلاق القائمة',
    confirmPassword: 'تأكيد كلمة المرور',
    createAccount: 'إنشاء حساب',
    createYourAccount: 'أنشئ حسابك',
    creatingAccount: 'جارٍ إنشاء الحساب...',
    delivered: 'تم التسليم',
    deliveredOn: 'تم التسليم في',
    developmentResetCode: 'رمز إعادة التعيين للتطوير:',
    email: 'البريد الإلكتروني',
    english: 'الإنجليزية',
    failedToLoadProducts: 'فشل تحميل المنتجات.',
    forgotCopy:
      'اطلب رمز إعادة التعيين ثم أكده هنا مع كلمة المرور الجديدة. استخدم نفس البريد الإلكتروني الذي سجلت به. الحسابات التي تعتمد على Google فقط لا تستخدم رموز إعادة التعيين.',
    forgotPassword: 'هل نسيت كلمة المرور؟',
    hide: 'إخفاء',
    itemCount: ({ count }) => `${count} ${Number(count) === 1 ? 'منتج' : 'منتجات'}`,
    joinJCMarket: 'انضم إلى JCMarket',
    language: 'اللغة',
    loginCopy: 'استخدم بريدك الإلكتروني وكلمة المرور، أو تابع باستخدام Google أدناه.',
    loginCorner: 'بوابة الدخول',
    logout: 'تسجيل الخروج',
    menu: 'القائمة',
    myAccount: 'حسابي',
    name: 'الاسم',
    newHere: 'جديد هنا؟',
    newMember: 'عضو جديد',
    newPassword: 'كلمة المرور الجديدة',
    noProductsAvailable: 'لا توجد منتجات متاحة الآن.',
    noProductsMatched: ({ search }) =>
      `لا توجد منتجات مطابقة لـ "${search}". جرّب كلمة أوسع أو كتابة أبسط.`,
    openMenu: 'فتح القائمة',
    orContinueWith: 'أو تابع باستخدام',
    orderId: 'رقم الطلب',
    orderPlaced: 'تاريخ الطلب',
    orders: 'الطلبات',
    ordersPageTitle: 'طلباتك',
    password: 'كلمة المرور',
    passwordRecovery: 'استعادة كلمة المرور',
    passwordsDoNotMatch: 'كلمتا المرور غير متطابقتين.',
    preparing: 'قيد التجهيز',
    profileImage: 'صورة الملف الشخصي',
    profileImageHelp: 'اضغط على أيقونة الكاميرا لرفع صورتك.',
    profileImageUpdated: 'رسالة من JCMarket: تم تحديث صورة ملفك الشخصي.',
    quantity: 'الكمية',
    registerCopy: 'أنشئ حسابك وابدأ التسوق مع JCMarket.',
    resetCode: 'رمز إعادة التعيين',
    resetCodeEmailSent: 'أرسل JCMarket رمز إعادة التعيين إلى بريدك الإلكتروني من الخادم.',
    resetPassword: 'إعادة تعيين كلمة المرور',
    search: 'بحث',
    searchPlaceholder: 'ابحث',
    shipped: 'تم الشحن',
    show: 'إظهار',
    signIn: 'تسجيل الدخول',
    signInTitle: 'سجّل الدخول',
    signingIn: 'جارٍ تسجيل الدخول...',
    sendResetCode: 'إرسال رمز إعادة التعيين',
    sendingCode: 'جارٍ إرسال الرمز...',
    startOver: 'ابدأ من جديد',
    total: 'الإجمالي',
    trackPackage: 'تتبع الشحنة',
    updatePassword: 'تحديث كلمة المرور',
    updateProfileImage: 'تحديث صورة الملف الشخصي',
    updatingPassword: 'جارٍ تحديث كلمة المرور...',
    updatingProfileImage: 'جارٍ تحديث صورة الملف الشخصي...',
    viewAllOrders: 'عرض كل الطلبات',
    welcomeBack: 'مرحبًا بعودتك',
    yourAccount: 'حسابك'
  }
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function resolveInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return savedLanguage === 'ar' ? 'ar' : 'en';
}

function interpolateText(template: string, params: TranslationParams = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? '' : String(value);
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(resolveInitialLanguage);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const direction = language === 'ar' ? 'rtl' : 'ltr';

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.setAttribute('dir', direction);
    document.body.dataset.language = language;
  }, [language]);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  };

  const t = useCallback((key: string, params?: TranslationParams) => {
    const selectedTranslation = translations[language][key] ?? translations.en[key];

    if (!selectedTranslation) {
      return key;
    }

    if (typeof selectedTranslation === 'function') {
      return selectedTranslation(params ?? {});
    }

    return interpolateText(selectedTranslation, params);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        isArabic: language === 'ar',
        language,
        setLanguage,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider.');
  }

  return context;
}
