import React, { useState } from "react";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleAdd = () => {
    const product = { name, quantity };
    console.log(product);
    alert("Product Added ✅");
  };

  return (
    <div className="p-5">
      <h2>Add Product</h2>

      <input placeholder="Name"
        className="border p-2 block my-2"
        onChange={(e) => setName(e.target.value)} />

      <input type="number" placeholder="Quantity"
        className="border p-2 block my-2"
        onChange={(e) => setQuantity(e.target.value)} />

      <button onClick={handleAdd}
        className="bg-green-500 text-white p-2">
        Add
      </button>
    </div>
  );
};

export default AddProduct;