import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

const RequirementsTab = ({ form, setForm, errors }) => {
  const handleRequirementChange = (index, value) => {
    const newRequirements = [...form.requirements];
    newRequirements[index] = value;
    setForm({ ...form, requirements: newRequirements });
  };

  const addRequirement = () => {
    setForm({
      ...form,
      requirements: [...form.requirements, '']
    });
  };

  const removeRequirement = (index) => {
    setForm({
      ...form,
      requirements: form.requirements.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Course Requirements</h3>
        <p className="text-gray-600 mb-4">
          List what students need to know or have before starting this course
        </p>
      </div>

      <div className="space-y-4">
        {form.requirements.map((requirement, index) => (
          <div key={index} className="flex items-center gap-3">
            <input
              type="text"
              value={requirement}
              onChange={(e) => handleRequirementChange(index, e.target.value)}
              placeholder="e.g., Basic understanding of mathematics"
              className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => removeRequirement(index)}
              className="p-2 text-gray-400 hover:text-red-500"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRequirement}
        className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
      >
        <FaPlus className="mr-2" /> Add Requirement
      </button>
    </div>
  );
};

export default RequirementsTab;