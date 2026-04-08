import React, { useEffect, useRef, useState } from 'react'
import { FaCommentDots, FaPaperPlane, FaRobot, FaTimes } from 'react-icons/fa'
import api from '../lib/api'
import './ChatWidget.css'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [threadId, setThreadId] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          text: "Hello! I'm your shopping assistant. I can help you search products, compare options, and answer delivery questions.",
          isAgent: true
        }
      ])
    }
  }, [isOpen, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleChat = () => {
    setIsOpen((currentOpen) => !currentOpen)
  }

  const handleInputChange = (event) => {
    setInputValue(event.target.value)
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()

    const trimmedMessage = inputValue.trim()
    if (!trimmedMessage || isSending) {
      return
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        text: trimmedMessage,
        isAgent: false
      }
    ])
    setInputValue('')
    setIsSending(true)

    try {
      const endpoint = threadId ? `/api/chat/${threadId}` : '/api/chat'
      const response = await api.post(endpoint, {
        message: trimmedMessage
      })

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: response.data.response,
          isAgent: true
        }
      ])
      setThreadId(response.data.threadId)
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: 'I could not reach the shopping assistant right now. Please try again in a moment.',
          isAgent: true
        }
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className={`chat-widget-container ${isOpen ? 'open' : ''}`}>
      {isOpen ? (
        <>
          <div className="chat-header">
            <div className="chat-title">
              <FaRobot />
              <h3>Shop Assistant</h3>
            </div>
            <button className="close-button" onClick={toggleChat}>
              <FaTimes />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index}>
                <div className={`message ${message.isAgent ? 'message-bot' : 'message-user'}`}>
                  {message.text}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-container" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="message-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={handleInputChange}
              disabled={isSending}
            />
            <button
              type="submit"
              className="send-button"
              disabled={inputValue.trim() === '' || isSending}
            >
              <FaPaperPlane size={16} />
            </button>
          </form>
        </>
      ) : (
        <button className="chat-button" onClick={toggleChat}>
          <FaCommentDots />
        </button>
      )}
    </div>
  )
}

export default ChatWidget
