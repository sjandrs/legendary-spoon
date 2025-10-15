import React, { useState, useEffect } from 'react';
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseItems,
  createWarehouseItem,
  updateWarehouseItem,
  deleteWarehouseItem
} from '../api';
import './Warehouse.css';
import GtinInput from './GtinInput';

const Warehouse = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseItems, setWarehouseItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [warehouseFormData, setWarehouseFormData] = useState({
    name: '',
    location: '',
    description: ''
  });

  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    sku: '',
    gtin: '',
    quantity: '',
    minimum_stock: '',
    unit_cost: '',
    warehouse: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [warehousesResponse, itemsResponse] = await Promise.all([
        getWarehouses(),
        getWarehouseItems()
      ]);
      setWarehouses(warehousesResponse.data);
      setWarehouseItems(itemsResponse.data);
    } catch (_err) {
      setError('Failed to fetch warehouse data');
      console.error(_err);
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, warehouseFormData);
      } else {
        await createWarehouse(warehouseFormData);
      }
      fetchData();
      resetWarehouseForm();
    } catch (_err) {
      setError('Failed to save warehouse');
      console.error(_err);
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...itemFormData,
        quantity: parseFloat(itemFormData.quantity),
        minimum_stock: parseFloat(itemFormData.minimum_stock),
        unit_cost: parseFloat(itemFormData.unit_cost)
      };

      if (editingItem) {
        await updateWarehouseItem(editingItem.id, data);
      } else {
        await createWarehouseItem(data);
      }
      fetchData();
      resetItemForm();
    } catch (_err) {
      setError('Failed to save warehouse item');
      console.error(_err);
    }
  };

  const handleWarehouseEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseFormData({
      name: warehouse.name,
      location: warehouse.location,
      description: warehouse.description
    });
    setShowWarehouseForm(true);
  };

  const handleItemEdit = (item) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      description: item.description,
      sku: item.sku,
      gtin: item.gtin || '',
      quantity: item.quantity.toString(),
      minimum_stock: item.minimum_stock.toString(),
      unit_cost: item.unit_cost.toString(),
      warehouse: item.warehouse
    });
    setShowItemForm(true);
  };

  const handleWarehouseDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this warehouse? This will also delete all associated items.')) {
      try {
        await deleteWarehouse(id);
        fetchData();
      } catch (_err) {
        setError('Failed to delete warehouse');
        console.error(_err);
      }
    }
  };

  const handleItemDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this warehouse item?')) {
      try {
        await deleteWarehouseItem(id);
        fetchData();
      } catch (_err) {
        setError('Failed to delete warehouse item');
        console.error(_err);
      }
    }
  };

  const resetWarehouseForm = () => {
    setWarehouseFormData({
      name: '',
      location: '',
      description: ''
    });
    setEditingWarehouse(null);
    setShowWarehouseForm(false);
  };

  const resetItemForm = () => {
    setItemFormData({
      name: '',
      description: '',
      sku: '',
      quantity: '',
      minimum_stock: '',
      unit_cost: '',
      warehouse: ''
    });
    setEditingItem(null);
    setShowItemForm(false);
  };

  const getLowStockItems = () => {
    return warehouseItems.filter(item => item.quantity <= item.minimum_stock);
  };

  const getTotalInventoryValue = () => {
    return warehouseItems.reduce((total, item) => total + (item.quantity * item.unit_cost), 0);
  };

  if (loading) return <div>Loading warehouse data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="warehouse">
      <div className="warehouse-header">
        <h1>Warehouse Management</h1>
      </div>

      {/* Summary Cards */}
      <div className="warehouse-summary">
        <div className="summary-card">
          <h3>Total Warehouses</h3>
          <p className="summary-value">{warehouses.length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Items</h3>
          <p className="summary-value">{warehouseItems.length}</p>
        </div>
        <div className="summary-card">
          <h3>Low Stock Items</h3>
          <p className="summary-value warning">{getLowStockItems().length}</p>
        </div>
        <div className="summary-card">
          <h3>Inventory Value</h3>
          <p className="summary-value">${getTotalInventoryValue().toFixed(2)}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="warehouse-tabs">
        <button
          className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Warehouse Items
        </button>
        <button
          className={`tab-button ${activeTab === 'warehouses' ? 'active' : ''}`}
          onClick={() => setActiveTab('warehouses')}
        >
          Warehouses
        </button>
      </div>

      {/* Warehouse Items Tab */}
      {activeTab === 'items' && (
        <div className="warehouse-tab-content">
          <div className="tab-header">
            <h2>Warehouse Items</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowItemForm(!showItemForm)}
            >
              {showItemForm ? 'Cancel' : 'Add Item'}
            </button>
          </div>

          {/* Item Form */}
          {showItemForm && (
            <div className="warehouse-form">
              <h3>{editingItem ? 'Edit Warehouse Item' : 'Add New Warehouse Item'}</h3>
              <form onSubmit={handleItemSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="item-name">Name:</label>
                    <input
                      id="item-name"
                      type="text"
                      value={itemFormData.name}
                      onChange={(e) => setItemFormData({...itemFormData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="item-sku">SKU:</label>
                    <input
                      id="item-sku"
                      type="text"
                      value={itemFormData.sku}
                      onChange={(e) => setItemFormData({...itemFormData, sku: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="item-gtin">GTIN:</label>
                    <GtinInput
                      id="item-gtin"
                      value={itemFormData.gtin}
                      onChange={(e) => setItemFormData({ ...itemFormData, gtin: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="item-description">Description:</label>
                  <textarea
                    id="item-description"
                    value={itemFormData.description}
                    onChange={(e) => setItemFormData({...itemFormData, description: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="item-quantity">Quantity:</label>
                    <input
                      id="item-quantity"
                      type="number"
                      min="0"
                      value={itemFormData.quantity}
                      onChange={(e) => setItemFormData({...itemFormData, quantity: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="item-min-stock">Minimum Stock:</label>
                    <input
                      id="item-min-stock"
                      type="number"
                      min="0"
                      value={itemFormData.minimum_stock}
                      onChange={(e) => setItemFormData({...itemFormData, minimum_stock: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="item-unit-cost">Unit Cost:</label>
                    <input
                      id="item-unit-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemFormData.unit_cost}
                      onChange={(e) => setItemFormData({...itemFormData, unit_cost: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="warehouse-select">Warehouse:</label>
                  <select
                    id="warehouse-select"
                    value={itemFormData.warehouse}
                    onChange={(e) => setItemFormData({...itemFormData, warehouse: e.target.value})}
                    required
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={resetItemForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Items List */}
          <div className="warehouse-items-list">
            {warehouseItems.length === 0 ? (
              <p>No warehouse items found. Add your first item!</p>
            ) : (
              <div className="striped-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Warehouse</th>
                      <th>Quantity</th>
                      <th>Min Stock</th>
                      <th>Unit Cost</th>
                      <th>Total Value</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.sku}</td>
                        <td>{item.warehouse_name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.minimum_stock}</td>
                        <td>${item.unit_cost.toFixed(2)}</td>
                        <td>${(item.quantity * item.unit_cost).toFixed(2)}</td>
                        <td>
                          <span className={`status ${item.quantity <= item.minimum_stock ? 'low-stock' : 'in-stock'}`}>
                            {item.quantity <= item.minimum_stock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => handleItemEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleItemDelete(item.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warehouses Tab */}
      {activeTab === 'warehouses' && (
        <div className="warehouse-tab-content">
          <div className="tab-header">
            <h2>Warehouses</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowWarehouseForm(!showWarehouseForm)}
            >
              {showWarehouseForm ? 'Cancel' : 'Add Warehouse'}
            </button>
          </div>

          {/* Warehouse Form */}
          {showWarehouseForm && (
            <div className="warehouse-form">
              <h3>{editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}</h3>
              <form onSubmit={handleWarehouseSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="warehouse-name">Name:</label>
                    <input
                      id="warehouse-name"
                      type="text"
                      value={warehouseFormData.name}
                      onChange={(e) => setWarehouseFormData({...warehouseFormData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="warehouse-location">Location:</label>
                    <input
                      id="warehouse-location"
                      type="text"
                      value={warehouseFormData.location}
                      onChange={(e) => setWarehouseFormData({...warehouseFormData, location: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="warehouse-description">Description:</label>
                  <textarea
                    id="warehouse-description"
                    value={warehouseFormData.description}
                    onChange={(e) => setWarehouseFormData({...warehouseFormData, description: e.target.value})}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingWarehouse ? 'Update Warehouse' : 'Add Warehouse'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={resetWarehouseForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Warehouses List */}
          <div className="warehouses-list">
            {warehouses.length === 0 ? (
              <p>No warehouses found. Add your first warehouse!</p>
            ) : (
              <div className="striped-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Description</th>
                      <th>Item Count</th>
                      <th>Total Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map(warehouse => {
                      const warehouseItemsCount = warehouseItems.filter(item => item.warehouse === warehouse.id).length;
                      const warehouseValue = warehouseItems
                        .filter(item => item.warehouse === warehouse.id)
                        .reduce((total, item) => total + (item.quantity * item.unit_cost), 0);

                      return (
                        <tr key={warehouse.id}>
                          <td>{warehouse.name}</td>
                          <td>{warehouse.location}</td>
                          <td>{warehouse.description}</td>
                          <td>{warehouseItemsCount}</td>
                          <td>${warehouseValue.toFixed(2)}</td>
                          <td>
                            <button
                              className="btn btn-small btn-secondary"
                              onClick={() => handleWarehouseEdit(warehouse)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleWarehouseDelete(warehouse.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouse;
