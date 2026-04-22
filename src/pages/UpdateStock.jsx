import React, { useState } from "react";

const UpdateStock = () => {
  const [id, setId] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleUpdate = () => {
    if (quantity < 0) {
      alert("Stock cannot be negative ❌");
      return;
    }

    console.log({ id, quantity });
    alert("Stock Updated ✅");
  };

  return (
    <div className="p-5">
      <h2>Update Stock</h2>

      <input placeholder="Product ID"
        className="border p-2 block my-2"
        onChange={(e) => setId(e.target.value)} />

      <input type="number" placeholder="Quantity"
        className="border p-2 block my-2"
        onChange={(e) => setQuantity(e.target.value)} />

      <button onClick={handleUpdate}
        className="bg-purple-500 text-white p-2">
        Update
      </button>
    </div>
  );
};

export default UpdateStock;