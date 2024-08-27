import React, { useEffect, useState } from "react";
import "./ListProduct.css";
import cross_icon from '../../assets/cross_icon.png';

const ListProduct = () => {
  const [allproducts, setAllProducts] = useState([]);

  const fetchInfo = async () => {
    try {
      const response = await fetch("http://localhost:4000/allproducts");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setAllProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <div className="list-product">
      <h1>ALL Products List</h1>
      <div className="listproduct-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Old Price</p>
        <p>New Price</p>
        <p>Category</p>
        <p>Stock Quantity</p>
        <p>Remove</p>
      </div>
      <div className="listproduct-allproduct">
        <hr />
        {allproducts.map((product, index) => (
          <div key={product.id || index} className="listproduct-format-main listproduct-format">
            <img src={product.image} alt={product.name} className="listproduct-product-icon" />
            <p>{product.name}</p>
            <p>${product.old_price}</p>
            <p>${product.new_price}</p>
            <p>{product.category}</p>
            <p>{product.stock_quantity}</p>
            <img src={cross_icon} alt="Remove" className="listproduct-remove-icon" />
          </div>
        ))}
        <hr />
      </div>
    </div>
  );
};

export default ListProduct;