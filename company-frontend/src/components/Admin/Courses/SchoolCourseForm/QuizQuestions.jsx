import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

const QuizQuestions = ({
  chapterIndex,
  lessonIndex,
  questions,
  addQuizQuestion,
  removeQuizQuestion,
  handleQuizQuestionChange,
  errors
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h6 className="font-medium">Quiz Questions</h6>
        <button
          type="button"
          onClick={() => addQuizQuestion(chapterIndex, lessonIndex)}
          className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs flex items-center"
        >
          <FaPlus className="mr-1" /> Add Question
        </button>
      </div>
      
      {questions.map((question, questionIndex) => (
        <div 
          key={`question-${chapterIndex}-${lessonIndex}-${questionIndex}`}
          className="p-4 border border-gray-200 rounded-lg space-y-3"
        >
          <div className="flex justify-between items-center">
            <span className="font-medium">Question {questionIndex + 1}</span>
            <button
              type="button"
              onClick={() => removeQuizQuestion(chapterIndex, lessonIndex, questionIndex)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </div>
          
          <input
            type="text"
            value={question.question}
            onChange={(e) => handleQuizQuestionChange(chapterIndex, lessonIndex, questionIndex, 'question', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="Enter question"
          />
          
          <div className="space-y-2">
            <label className="block text-gray-700">Options</label>
            {question.options.map((option, optionIndex) => (
              <div key={`option-${chapterIndex}-${lessonIndex}-${questionIndex}-${optionIndex}`} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`correct-${chapterIndex}-${lessonIndex}-${questionIndex}`}
                  checked={question.correctAnswer === optionIndex}
                  onChange={() => handleQuizQuestionChange(chapterIndex, lessonIndex, questionIndex, 'correctAnswer', optionIndex)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleQuizQuestionChange(chapterIndex, lessonIndex, questionIndex, 'options', e.target.value, optionIndex)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  placeholder={`Option ${optionIndex + 1}`}
                />
              </div>
            ))}
            <p className="text-sm text-gray-500">Select the radio button for the correct answer</p>
          </div>
        </div>
      ))}
      
      {errors && <p className="text-red-500 text-sm">{errors}</p>}
    </div>
  );
};

export default QuizQuestions;