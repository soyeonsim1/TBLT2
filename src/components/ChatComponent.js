
import React, { useEffect, useState, useRef } from 'react';
import Modal from 'react-modal';

const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
    },
  };
const prompt = `
${process.env.REACT_APP_PROMPT_KEY}${process.env.REACT_APP_PROMPT_KEY2}
`
Modal.setAppElement('#root');

class Message {
    constructor(id, text, sender) {
        this.id = id;
        this.text = text;
        this.sender = sender;
    }
}

const ChatComponent = () => {
    const chatEndRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [modalIsOpen, setIsOpen] = useState(true);
    const [isPromptModelOpen, setPromptModalOpen] = useState(false);
    const [studentId, setStudentId] = useState('');
    function openModal() {
        setIsOpen(true);
    }
    function closeModal() {
        setIsOpen(false);
    }
    const handleInputChange = (e) => {
        setInputText(e.target.value);
    };
    const sendMessageUserInput = async () => {
        const userInput = inputText.trim();
        if (!userInput) return;
        sendMessage(userInput);
        setInputText('');
    }
    const sendMessage = async (text) => {
        const userMessage = new Message(Date.now(), text, 'user');
        setMessages([...messages, userMessage]);

        // Call to OpenAI's API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [...messages.map((message) => ({
                    role: message.sender,
                    content: message.text
                })), { role: 'user', content: text }],
                max_tokens: 4096
            })
        });

        const data = await response.json();
        const aiMessage = new Message(Date.now(), data.choices[0].message.content, data.choices[0].message.role);
        setMessages([...messages, userMessage, aiMessage]);
    };

    useEffect(() => {
        setMessages([]);
        sendMessage(prompt);
    }, []);

    useEffect(() => {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            sendMessageUserInput();
        }
    }
    const exportChat = () => {
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(messages.slice(1).map(msg => ({ id: new Date(msg.id).toLocaleString(), text: msg.text, sender: msg.sender })), null, 2)], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        const shortDate = new Intl.DateTimeFormat("en", {
            dateStyle: "short",
          });
        element.download = `T1S1_${shortDate.format(Date.now())}_${studentId}.txt`;
        document.body.appendChild(element);
        element.click();
        setPromptModalOpen(true);
    };

    return (
        <div>
            <button id="export-button" onClick={exportChat}>Done</button>

            <Modal
                isOpen={isPromptModelOpen}
                onRequestClose={() => setPromptModalOpen(false)}
                style={customStyles}
                contentLabel="prompt"
            >
                <h2>The task is now complete. Please keep the window open and wait for assistance.</h2>
                <button onClick={() => setPromptModalOpen(false)}>close</button>
            </Modal>

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={customStyles}
                contentLabel="name"
            >
                <h2>Please enter your full name.</h2>
                <input onChange={(event) => setStudentId(event.target.value)}/>
                <button onClick={closeModal}>Start</button>
                <form>
                </form>
            </Modal>

            <div className="chat-window">
                {messages.map((msg, index) => {
                    if (index === 0) {
                        return;
                    }
                    return <div key={msg.id} className={`message ${msg.sender}`}>
                        {msg.text}
                    </div>
                }
                )}
                <div ref={chatEndRef} />
            </div>
            <input id="chat-input" type="text" value={inputText} onChange={handleInputChange} onKeyDown={onKeyDown}/>
            <button id="enter" onClick={sendMessageUserInput}>⬆</button>
        </div>
    );
};

export default ChatComponent;
