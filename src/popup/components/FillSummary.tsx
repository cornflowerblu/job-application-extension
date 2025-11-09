import { FillResult } from '../../types';

import { FormField } from '../../types';

interface FillSummaryProps {
  result: FillResult;
  formFields: FormField[];
  onClose: () => void;
}

export function FillSummary({ result, formFields, onClose }: FillSummaryProps) {
  const getFieldLabel = (fieldId: string): string => {
    const field = formFields.find(f => f.id === fieldId);
    return field?.label || fieldId;
  };

  const total = result.filled.length + result.skipped.length + result.errors.length;

  return (
    <div className="w-96 min-h-96 max-h-[600px] flex flex-col p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">✓</span>
          <h1 className="text-2xl font-bold text-gray-900">Form Filled Successfully</h1>
        </div>
        <p className="text-sm text-gray-600">
          Filled {result.filled.length} of {total} fields
        </p>
      </div>

      {/* Summary Stats */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <p className="text-xs text-green-600 font-medium">Filled</p>
          <p className="text-lg font-bold text-green-900">{result.filled.length}</p>
        </div>
        {result.skipped.length > 0 && (
          <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <p className="text-xs text-yellow-600 font-medium">Skipped</p>
            <p className="text-lg font-bold text-yellow-900">{result.skipped.length}</p>
          </div>
        )}
        {result.errors.length > 0 && (
          <div className="flex-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-xs text-red-600 font-medium">Errors</p>
            <p className="text-lg font-bold text-red-900">{result.errors.length}</p>
          </div>
        )}
      </div>

      {/* Scrollable details */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {/* Filled fields */}
        {result.filled.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-green-700 mb-2">Successfully Filled</h3>
            <div className="space-y-2">
              {result.filled.slice(0, 5).map((item) => (
                <div
                  key={item.fieldId}
                  className="bg-white border border-green-200 rounded px-3 py-2"
                >
                  <p className="text-xs font-medium text-gray-900">{getFieldLabel(item.fieldId)}</p>
                  <p className="text-xs text-gray-600 truncate mt-0.5">
                    {String(item.value).substring(0, 100)}
                    {String(item.value).length > 100 ? '...' : ''}
                  </p>
                </div>
              ))}
              {result.filled.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  + {result.filled.length - 5} more fields filled
                </p>
              )}
            </div>
          </div>
        )}

        {/* Skipped fields */}
        {result.skipped.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-yellow-700 mb-2">Skipped Fields</h3>
            <div className="space-y-2">
              {result.skipped.map((item) => (
                <div
                  key={item.fieldId}
                  className="bg-white border border-yellow-200 rounded px-3 py-2"
                >
                  <p className="text-xs font-medium text-gray-900">{getFieldLabel(item.fieldId)}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error fields */}
        {result.errors.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-2">Errors</h3>
            <div className="space-y-2">
              {result.errors.map((item) => (
                <div
                  key={item.fieldId}
                  className="bg-white border border-red-200 rounded px-3 py-2"
                >
                  <p className="text-xs font-medium text-gray-900">{getFieldLabel(item.fieldId)}</p>
                  <p className="text-xs text-red-600 mt-0.5">{item.error}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Close button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
