import React, { useState } from "react";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [categorys, setCategorys] = useState(""); // ⚠️ same as backend
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const handleAdd = async () => {
    try {
      const product = {
        name,
        categorys, // ⚠️ backend me yehi naam hai
        price: Number(price),
        stock: Number(stock),
      };

      console.log("Sending:", product);

      const res = await fetch(
        "https://api-inventory-management-kevv.onrender.com/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(product),
        }
      );

      const data = await res.json();
      console.log("API RESPONSE:", data);

      if (!res.ok) {
        alert(data.message || "Error adding product ❌");
        return;
      }

      alert("Product Added ✅");

      // reset form
      setName("");
      setCategorys("");
      setPrice("");
      setStock("");

    } catch (err) {
      console.log("ERROR:", err);
      alert("Server error ❌");
    }
  };

  return (
    <div className="p-5">
      <h2>Add Product</h2>

      <input
        placeholder="Name"
        className="border p-2 block my-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Category (shirt/pant)"
        className="border p-2 block my-2"
        value={categorys}
        onChange={(e) => setCategorys(e.target.value)}
      />

      <input
        type="number"
        placeholder="Price"
        className="border p-2 block my-2"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        type="number"
        placeholder="Stock"
        className="border p-2 block my-2"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
      />

      <button
        onClick={handleAdd}
        className="bg-green-500 text-white p-2"
      >
        Add
      </button>
    </div>
  );
};

export default AddProduct;