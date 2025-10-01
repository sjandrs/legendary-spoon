import React, { useState, useEffect } from 'react';
import api from '../api';
import './PaperworkTemplateManager.css';

const PaperworkTemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    content: '',
    conditional_logic: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState({});

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/api/paperwork-templates/');
      setTemplates(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleNewTemplate = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: '',
      content: '',
      conditional_logic: '',
      is_active: true
    });
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  const handleEditTemplate = (template) => {
    setTemplateForm({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
      conditional_logic: template.conditional_logic || '',
      is_active: template.is_active
    });
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedTemplate) {
        await api.patch(`/api/paperwork-templates/${selectedTemplate.id}/`, templateForm);
      } else {
        await api.post('/api/paperwork-templates/', templateForm);
      }

      setShowEditor(false);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.delete(`/api/paperwork-templates/${templateId}/`);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handlePreview = () => {
    setPreviewMode(true);
  };

  const insertVariable = (variable) => {
    const textarea = document.querySelector('.content-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const newContent = before + `{{${variable}}}` + after;
    setTemplateForm({...templateForm, content: newContent});

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
    }, 0);
  };

  const insertConditionalLogic = (logic) => {
    const textarea = document.querySelector('.logic-editor');
    const currentLogic = templateForm.conditional_logic;
    const newLogic = currentLogic ? `${currentLogic}\n${logic}` : logic;
    setTemplateForm({...templateForm, conditional_logic: newLogic});
  };

  const renderPreview = () => {
    if (!previewMode) return null;

    let processedContent = templateForm.content;

    // Replace variables with sample data
    const sampleData = {
      customer_name: 'John Smith',
      customer_address: '123 Main St, City, ST 12345',
      customer_phone: '(555) 123-4567',
      technician_name: 'Mike Johnson',
      work_order_id: 'WO-2025-001',
      service_date: new Date().toLocaleDateString(),
      service_description: 'HVAC System Maintenance',
      total_amount: '$250.00',
      ...previewData
    };

    Object.keys(sampleData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, sampleData[key]);
    });

    return (
      <div className="preview-container">
        <div className="preview-header">
          <h3>Template Preview</h3>
          <button onClick={() => setPreviewMode(false)}>Close Preview</button>
        </div>
        <div className="preview-content" dangerouslySetInnerHTML={{__html: processedContent}} />
      </div>
    );
  };

  const availableVariables = [
    'customer_name', 'customer_address', 'customer_phone', 'customer_email',
    'technician_name', 'technician_phone', 'work_order_id', 'service_date',
    'service_description', 'service_location', 'estimated_duration',
    'total_amount', 'payment_method', 'completion_date', 'notes'
  ];

  const conditionalLogicExamples = [
    'if service_type == "maintenance" then show maintenance_checklist',
    'if total_amount > 100 then require_signature',
    'if customer_type == "commercial" then include_tax_id',
    'if technician_level >= 3 then allow_advanced_options'
  ];

  return (
    <div className="paperwork-manager">
      <div className="manager-header">
        <h1>Paperwork Template Manager</h1>
        <button className="btn btn-primary" onClick={handleNewTemplate}>
          + New Template
        </button>
      </div>

      {!showEditor && (
        <div className="templates-grid">
          {templates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <h3>{template.name}</h3>
                <div className="template-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEditTemplate(template)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="template-description">{template.description}</p>
              <div className="template-meta">
                <span className="category-tag">{template.category}</span>
                <span className={`status-tag ${template.is_active ? 'active' : 'inactive'}`}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <div className="template-editor">
          <div className="editor-header">
            <h2>{selectedTemplate ? 'Edit Template' : 'New Template'}</h2>
            <div className="editor-actions">
              <button type="button" onClick={handlePreview}>
                Preview
              </button>
              <button type="button" onClick={() => setShowEditor(false)}>
                Cancel
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveTemplate}>
            <div className="editor-layout">
              <div className="editor-main">
                <div className="form-group">
                  <label>Template Name</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={templateForm.description}
                      onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      <option value="invoice">Invoice</option>
                      <option value="estimate">Estimate</option>
                      <option value="work_order">Work Order</option>
                      <option value="receipt">Receipt</option>
                      <option value="contract">Contract</option>
                      <option value="safety_checklist">Safety Checklist</option>
                      <option value="completion_report">Completion Report</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Template Content (HTML supported)</label>
                  <textarea
                    className="content-editor"
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm({...templateForm, content: e.target.value})}
                    rows="20"
                    placeholder="Enter your template content here. Use {{variable_name}} for dynamic content."
                  />
                </div>

                <div className="form-group">
                  <label>Conditional Logic (Optional)</label>
                  <textarea
                    className="logic-editor"
                    value={templateForm.conditional_logic}
                    onChange={(e) => setTemplateForm({...templateForm, conditional_logic: e.target.value})}
                    rows="5"
                    placeholder="Define conditions for when this template should be used or how it should be modified."
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={templateForm.is_active}
                      onChange={(e) => setTemplateForm({...templateForm, is_active: e.target.checked})}
                    />
                    Active Template
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>

              <div className="editor-sidebar">
                <div className="sidebar-section">
                  <h4>Available Variables</h4>
                  <div className="variable-list">
                    {availableVariables.map(variable => (
                      <button
                        key={variable}
                        type="button"
                        className="variable-btn"
                        onClick={() => insertVariable(variable)}
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sidebar-section">
                  <h4>Conditional Logic Examples</h4>
                  <div className="logic-examples">
                    {conditionalLogicExamples.map((example, index) => (
                      <div key={index} className="logic-example">
                        <code>{example}</code>
                        <button
                          type="button"
                          className="add-logic-btn"
                          onClick={() => insertConditionalLogic(example)}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sidebar-section">
                  <h4>Formatting Tips</h4>
                  <div className="formatting-tips">
                    <p><strong>Variables:</strong> Use {`{{variable_name}}`} for dynamic content</p>
                    <p><strong>HTML:</strong> You can use HTML tags for formatting</p>
                    <p><strong>Conditions:</strong> Use conditional logic to show/hide sections</p>
                    <p><strong>Lists:</strong> Use &lt;ul&gt; and &lt;li&gt; for bullet points</p>
                    <p><strong>Tables:</strong> Use &lt;table&gt; for structured data</p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {renderPreview()}
    </div>
  );
};

export default PaperworkTemplateManager;
