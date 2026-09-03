import React from "react";
import {
  FaHistory,
  FaTrash
} from "react-icons/fa";

import "./History.css";

function History() {

  const history = [
    {
      id: 1,
      question: "What is JavaScript?",
      date: "11 Aug 2026",
      time: "3:48 PM"
    },
    {
      id: 2,
      question: "Explain React.js",
      date: "11 Aug 2026",
      time: "03:48 PM"
    },
    {
      id: 3,
      question: "What is Node.js?",
      date: "11 Aug 2026",
      time: "3:49 PM"
    }
  ];

  return (
    <div className="history-page">

      <div className="history-header">
        <div>
          <h1>
            <FaHistory /> History
          </h1>

          <p>
            View your previous conversations
          </p>
        </div>

        <button className="clear-history">
          <FaTrash />
          Clear History
        </button>
      </div>


      <div className="history-list">

        {history.map((item) => (

          <div className="history-card" key={item.id}>

            <div className="history-icon">
              <FaHistory />
            </div>

            <div className="history-content">

              <h3>
                {item.question}
              </h3>

              <p>
                {item.date} • {item.time}
              </p>

            </div>

            <button className="delete-btn">
              <FaTrash />
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}

export default History;