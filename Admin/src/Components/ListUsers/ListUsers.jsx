import React, { useState, useEffect } from "react";
import "./ListUsers.css";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faTrash, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
// import EditUserModal from "./EditUserModal"; // Import the modal component
// import ConfirmationModal from "./ConfirmationModal"; // Import the confirmation modal component

const ListUser = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [error, setError] = useState(null);
  
    const fetchInfo = async () => {
      try {
        const response = await fetch("http://localhost:4000/allusers");
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log("Fetched data:", data); // Debugging statement
        setAllUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setError(error.message);
      }
    };
  
    useEffect(() => {
      fetchInfo();
    }, []);
  
    return (
      <div className="list-user">
        <h1>ALL Users List</h1>
        {error && <p className="error-message">Error: {error}</p>}
        <div className="listuser-header">
          <span>Name</span>
          <span>Email</span>
          <span>Date</span>
        </div>
        <hr />
        <div className="listuser-allusers">
          {allUsers.length > 0 ? (
            allUsers.map((user, index) => (
              <div key={user.id || index} className="listuser-row">
                <span>{user.name}</span>
                <span>{user.email}</span>
                <span>{new Date(user.date).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <p>No users found</p>
          )}
        </div>
      </div>
    );
  };
  
  export default ListUser;