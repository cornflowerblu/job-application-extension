import { useState } from 'react';

interface Fill {
  fieldId: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  maxLength?: number | null;
  options?: string[];
}

interface ReviewFillsViewProps {
  fills: Fill[];
  formFields: FormField[];
  onApprove: (approvedFills: Fill[]) => void;
  onCancel: () => void;
}

interface EditableFill extends Fill {
  skip: boolean;
}

export function ReviewFillsView({ fills, formFields, onApprove, onCancel }: ReviewFillsViewProps) {
  // Initialize editable fills with skip flag
  const [editableFills, setEditableFills] = useState<EditableFill[]>(
    fills.map(fill => ({ ...fill, skip: false }))
  );

  const handleValueChange = (fieldId: string, newValue: string) => {
    setEditableFills(prev =>
      prev.map(fill =>
        fill.fieldId === fieldId ? { ...fill, value: newValue } : fill
      )
    );
  };

  const handleSkipToggle = (fieldId: string) => {
    setEditableFills(prev =>
      prev.map(fill =>
        fill.fieldId === fieldId ? { ...fill, skip: !fill.skip } : fill
      )
    );
  };

  const handleApprove = () => {
    // Filter out skipped fills and remove the skip property
    const approvedFills = editableFills
      .filter(fill => !fill.skip)
      .map(({ skip, ...fill }) => fill);

    onApprove(approvedFills);
  };

  const getFieldLabel = (fieldId: string): string => {
    const field = formFields.find(f => f.id === fieldId);
    return field?.label || fieldId;
  };

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low'): string => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
    }
  };

  const approvedCount = editableFills.filter(f => !f.skip).length;
  const skippedCount = editableFills.filter(f => f.skip).length;

  return (
    <div className="w-96 min-h-96 max-h-[600px] flex flex-col p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Review Form Fills</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review and edit AI suggestions before filling the form
        </p>
      </div>

      {/* Summary Stats */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-600 font-medium">Total Fields</p>
          <p className="text-lg font-bold text-blue-900">{editableFills.length}</p>
        </div>
        <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <p className="text-xs text-green-600 font-medium">Will Fill</p>
          <p className="text-lg font-bold text-green-900">{approvedCount}</p>
        </div>
        <div className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-600 font-medium">Skipped</p>
          <p className="text-lg font-bold text-gray-900">{skippedCount}</p>
        </div>
      </div>

      {/* Scrollable fills list */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {editableFills.map((fill) => {
          const field = formFields.find(f => f.id === fill.fieldId);
          const fieldLabel = getFieldLabel(fill.fieldId);

          return (
            <div
              key={fill.fieldId}
              className={`border rounded-lg p-3 transition-all ${
                fill.skip
                  ? 'bg-gray-50 border-gray-300 opacity-60'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Field header with skip checkbox */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-900">
                      {fieldLabel}
                    </label>
                    {field?.required && (
                      <span className="text-xs text-red-600">*</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded ${getConfidenceColor(fill.confidence)}`}>
                      {fill.confidence}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{fill.reasoning}</p>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={fill.skip}
                    onChange={() => handleSkipToggle(fill.fieldId)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">Skip</span>
                </label>
              </div>

              {/* Editable value */}
              {!fill.skip && (
                <div>
                  {field?.type === 'textarea' ? (
                    <textarea
                      value={fill.value}
                      onChange={(e) => handleValueChange(fill.fieldId, e.target.value)}
                      rows={3}
                      maxLength={field?.maxLength || undefined}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : field?.type === 'select' && field?.options ? (
                    <select
                      value={fill.value}
                      onChange={(e) => handleValueChange(fill.fieldId, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field?.type === 'email' ? 'email' : field?.type === 'tel' ? 'tel' : 'text'}
                      value={fill.value}
                      onChange={(e) => handleValueChange(fill.fieldId, e.target.value)}
                      maxLength={field?.maxLength || undefined}
                      placeholder={field?.placeholder}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApprove}
          disabled={approvedCount === 0}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Approve & Fill ({approvedCount})
        </button>
      </div>
    </div>
  );
}
