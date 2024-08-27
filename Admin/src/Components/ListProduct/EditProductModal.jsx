import React, { useState } from 'react';
import './EditProductModal.css';

const EditProductModal = ({ product, onSave, onClose }) => {
  const [updatedProduct, setUpdatedProduct] = useState({ ...product });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:4000/editproduct', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
      });

      const data = await response.json();
      if (data.success) {
        onSave(data.product);
        onClose();
      } else {
        console.error('Error saving product:', data.message);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit Product</h2>
        <label>
          Name:
          <input
            type="text"
            name="name"
            value={updatedProduct.name}
            onChange={handleChange}
          />
        </label>
        <label>
         
        </label>
        <label>
          Category:
          <input
            type="text"
            name="category"
            value={updatedProduct.category}
            onChange={handleChange}
          />
        </label>
        <label>
          Old Price:
          <input
            type="number"
            name="old_price"
            value={updatedProduct.old_price}
            onChange={handleChange}
          />
        </label>
        <label>
          New Price:
          <input
            type="number"
            name="new_price"
            value={updatedProduct.new_price}
            onChange={handleChange}
          />
        </label>
        <label>
          Stock Quantity:
          <input
            type="number"
            name="stock_quantity"
            value={updatedProduct.stock_quantity}
            onChange={handleChange}
          />
        </label>
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default EditProductModal;
