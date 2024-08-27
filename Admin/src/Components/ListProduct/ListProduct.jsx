import React, { useState, useEffect } from "react";
import "./ListProduct.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import EditProductModal from "./EditProductModal"; // Import the modal component
import ConfirmationModal from "./ConfirmationModal"; // Import the confirmation modal component

const ListProduct = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchInfo = async () => {
    try {
      const response = await fetch("http://localhost:4000/allproducts");
      const data = await response.json();
      setAllProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleDelete = (id) => {
    setProductToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      await fetch("http://localhost:4000/removeproduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: productToDelete }),
      });

      setAllProducts(allProducts.filter((product) => product.id !== productToDelete));
      setShowConfirmModal(false);
    } catch (error) {
      console.error("Error removing product:", error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleSave = (updatedProduct) => {
    setAllProducts(
      allProducts.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
  };

  const closeModal = () => {
    setEditingProduct(null);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <div className="list-product">
      <h1>ALL Products List</h1>
      <div className="listproduct-header">
        <span>Products</span>
        <span>Title</span>
        <span>Old Price</span>
        <span>New Price</span>
        <span>Category</span>
        <span>Stock Quantity</span>
        <span>Actions</span>
      </div>
      <hr />
      <div className="listproduct-allproducts">
        {allProducts.map((product, index) => (
          <div key={product.id || index} className="listproduct-row">
            <img
              src={product.image}
              alt={product.name}
              className="listproduct-product-icon"
            />
            <span>{product.name}</span>
            <span>${product.old_price}</span>
            <span>${product.new_price}</span>
            <span>{product.category}</span>
            <span>{product.stock_quantity}</span>
            <span className="actions">
              <FontAwesomeIcon
                icon={faPenToSquare}
                onClick={() => handleEdit(product)}
                style={{ marginRight: "10px" }}
              />
              <FontAwesomeIcon
                icon={faTrash}
                onClick={() => handleDelete(product.id)}
              />
            </span>
          </div>
        ))}
      </div>
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
      <ConfirmationModal
        show={showConfirmModal}
        onClose={closeConfirmModal}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ListProduct;
