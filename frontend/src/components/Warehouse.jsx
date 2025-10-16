import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';
import GtinInput from './GtinInput';

const Warehouse = () => {
  const { t } = useTranslation('warehouse');
  const { formatCurrency, formatNumber } = useLocaleFormatting();
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
      setError(t('errors.load_failed'));
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
      setError(t('errors.save_failed'));
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
      setError(t('errors.save_item_failed'));
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
    if (window.confirm(t('confirm.delete_warehouse'))) {
      try {
        await deleteWarehouse(id);
        fetchData();
      } catch (_err) {
        setError(t('errors.delete_failed'));
        console.error(_err);
      }
    }
  };

  const handleItemDelete = async (id) => {
    if (window.confirm(t('confirm.delete_item'))) {
      try {
        await deleteWarehouseItem(id);
        fetchData();
      } catch (_err) {
        setError(t('errors.delete_item_failed'));
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

  if (loading) return <div>{t('status.loading')}</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="warehouse">
      <div className="warehouse-header">
        <h1>{t('title', { defaultValue: 'Warehouse Management' })}</h1>
      </div>

      {/* Summary Cards */}
      <div className="warehouse-summary">
        <div className="summary-card">
          <h3>{t('summary.total_warehouses')}</h3>
          <p className="summary-value">{formatNumber(warehouses.length)}</p>
        </div>
        <div className="summary-card">
          <h3>{t('summary.total_items')}</h3>
          <p className="summary-value">{formatNumber(warehouseItems.length)}</p>
        </div>
        <div className="summary-card">
          <h3>{t('summary.low_stock_items')}</h3>
          <p className="summary-value warning">{formatNumber(getLowStockItems().length)}</p>
        </div>
        <div className="summary-card">
          <h3>{t('summary.inventory_value')}</h3>
          <p className="summary-value">{formatCurrency(getTotalInventoryValue())}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="warehouse-tabs">
        <button
          className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          {t('tabs.items')}
        </button>
        <button
          className={`tab-button ${activeTab === 'warehouses' ? 'active' : ''}`}
          onClick={() => setActiveTab('warehouses')}
        >
          {t('tabs.warehouses')}
        </button>
      </div>

      {/* Warehouse Items Tab */}
      {activeTab === 'items' && (
        <div className="warehouse-tab-content">
          <div className="tab-header">
            <h2>{t('sections.items')}</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowItemForm(!showItemForm)}
            >
              {showItemForm ? t('actions.cancel', { ns: 'common' }) : t('actions.add_item')}
            </button>
          </div>

          {/* Item Form */}
          {showItemForm && (
            <div className="warehouse-form">
              <h3>{editingItem ? t('forms.edit_item') : t('forms.add_item')}</h3>
              <form onSubmit={handleItemSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="item-name">{t('common:common.name')}:</label>
                    <input
                      id="item-name"
                      type="text"
                      value={itemFormData.name}
                      onChange={(e) => setItemFormData({...itemFormData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="item-sku">{t('fields.sku')}:</label>
                    <input
                      id="item-sku"
                      type="text"
                      value={itemFormData.sku}
                      onChange={(e) => setItemFormData({...itemFormData, sku: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="item-gtin">{t('fields.gtin')}:</label>
                    <GtinInput
                      id="item-gtin"
                      value={itemFormData.gtin}
                      onChange={(e) => setItemFormData({ ...itemFormData, gtin: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="item-description">{t('common:common.description')}:</label>
                  <textarea
                    id="item-description"
                    value={itemFormData.description}
                    onChange={(e) => setItemFormData({...itemFormData, description: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="item-quantity">{t('common:common.quantity')}:</label>
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
                    <label htmlFor="item-min-stock">{t('fields.minimum_stock')}:</label>
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
                    <label htmlFor="item-unit-cost">{t('fields.unit_cost')}:</label>
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
                  <label htmlFor="warehouse-select">{t('fields.warehouse')}:</label>
                  <select
                    id="warehouse-select"
                    value={itemFormData.warehouse}
                    onChange={(e) => setItemFormData({...itemFormData, warehouse: e.target.value})}
                    required
                  >
                    <option value="">{t('tabs.warehouses')}</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? t('actions.update_item') : t('actions.add_item')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={resetItemForm}>
                    {t('common:actions.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Items List */}
          <div className="warehouse-items-list">
            {warehouseItems.length === 0 ? (
              <p>{t('messages.no_items')}</p>
            ) : (
              <div className="striped-table">
                <table role="table" aria-label={t('tabs.items')}>
                  <caption className="sr-only">{t('tabs.items')} — {t('fields.sku')}, {t('common:common.quantity')}, {t('fields.minimum_stock')}, {t('fields.unit_cost')}, {t('fields.total_value')}, {t('common:common.status')}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('common:common.name')}</th>
                      <th scope="col">{t('fields.sku')}</th>
                      <th scope="col">{t('fields.warehouse')}</th>
                      <th scope="col">{t('common:common.quantity')}</th>
                      <th scope="col">{t('fields.minimum_stock')}</th>
                      <th scope="col">{t('fields.unit_cost')}</th>
                      <th scope="col">{t('fields.total_value')}</th>
                      <th scope="col">{t('common:common.status')}</th>
                      <th scope="col">{t('columns.actions', { defaultValue: 'Actions' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseItems.map(item => (
                      <tr key={item.id}>
                        <th scope="row">{item.name}</th>
                        <td>{item.sku}</td>
                        <td>{item.warehouse_name}</td>
                        <td>{formatNumber(item.quantity)}</td>
                        <td>{formatNumber(item.minimum_stock)}</td>
                        <td>{formatCurrency(item.unit_cost)}</td>
                        <td>{formatCurrency(item.quantity * item.unit_cost)}</td>
                        <td>
                          <span className={`status ${item.quantity <= item.minimum_stock ? 'low-stock' : 'in-stock'}`}>
                            {item.quantity <= item.minimum_stock ? t('status.low_stock') : t('status.in_stock')}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => handleItemEdit(item)}
                          >
                            {t('common:actions.edit')}
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleItemDelete(item.id)}
                          >
                            {t('common:actions.delete')}
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
            <h2>{t('sections.warehouses')}</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowWarehouseForm(!showWarehouseForm)}
            >
              {showWarehouseForm ? t('actions.cancel', { ns: 'common' }) : t('actions.add_warehouse')}
            </button>
          </div>

          {/* Warehouse Form */}
          {showWarehouseForm && (
            <div className="warehouse-form">
              <h3>{editingWarehouse ? t('forms.edit_warehouse') : t('forms.add_warehouse')}</h3>
              <form onSubmit={handleWarehouseSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="warehouse-name">{t('common:common.name')}:</label>
                    <input
                      id="warehouse-name"
                      type="text"
                      value={warehouseFormData.name}
                      onChange={(e) => setWarehouseFormData({...warehouseFormData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="warehouse-location">{t('fields.location')}:</label>
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
                  <label htmlFor="warehouse-description">{t('common:common.description')}:</label>
                  <textarea
                    id="warehouse-description"
                    value={warehouseFormData.description}
                    onChange={(e) => setWarehouseFormData({...warehouseFormData, description: e.target.value})}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingWarehouse ? t('actions.update_warehouse') : t('actions.add_warehouse')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={resetWarehouseForm}>
                    {t('common:actions.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Warehouses List */}
          <div className="warehouses-list">
            {warehouses.length === 0 ? (
              <p>{t('messages.no_warehouses')}</p>
            ) : (
              <div className="striped-table">
                <table role="table" aria-label={t('tabs.warehouses')}>
                  <caption className="sr-only">{t('tabs.warehouses')} — {t('fields.location')}, {t('common:common.description')}, {t('fields.item_count')}, {t('fields.total_value')}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('common:common.name')}</th>
                      <th scope="col">{t('fields.location')}</th>
                      <th scope="col">{t('common:common.description')}</th>
                      <th scope="col">{t('fields.item_count')}</th>
                      <th scope="col">{t('fields.total_value')}</th>
                      <th scope="col">{t('columns.actions', { defaultValue: 'Actions' })}</th>
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
                          <th scope="row">{warehouse.name}</th>
                          <td>{warehouse.location}</td>
                          <td>{warehouse.description}</td>
                          <td>{formatNumber(warehouseItemsCount)}</td>
                          <td>{formatCurrency(warehouseValue)}</td>
                          <td>
                            <button
                              className="btn btn-small btn-secondary"
                              onClick={() => handleWarehouseEdit(warehouse)}
                            >
                              {t('common:actions.edit')}
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleWarehouseDelete(warehouse.id)}
                            >
                              {t('common:actions.delete')}
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
