import { useState } from 'react';
import { cvAPI } from '../utils/api';

export default function Generate() {
  const [jobDescription, setJobDescription] = useState('');
  const [jdLink, setJdLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await cvAPI.generate(jobDescription, jdLink);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate CV. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await cvAPI.preview(jobDescription);
      setPreview(response.data.cvContent);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setJobDescription('');
    setJdLink('');
    setResult(null);
    setPreview(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Tailored CV</h1>
        <p className="text-gray-500 mt-1">Paste a job description and we'll create a perfectly tailored CV</p>
      </div>

      {/* Success Result */}
      {result && (
        <div className="card p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-green-800">CV Generated Successfully!</h2>
              <p className="text-green-700 mt-1">
                Your tailored CV for <strong>{result.application?.jobTitle}</strong> at <strong>{result.application?.companyName}</strong> is ready.
              </p>
              <div className="flex gap-3 mt-4">
                <a
                  href={result.application?.cvDocUrl}
                  download
                  className="btn bg-green-600 text-white hover:bg-green-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download DOCX
                </a>
                <a
                  href={result.application?.cvPdfUrl}
                  download
                  className="btn bg-white text-green-700 border border-green-300 hover:bg-green-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
                <button onClick={handleReset} className="btn btn-secondary ml-auto">
                  Generate Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="card p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Input Form */}
      {!result && (
        <div className="card p-6 space-y-4">
          <div>
            <label className="label">Job Description *</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="input"
              rows="12"
              placeholder="Paste the complete job description here...

Include:
• Job title and company
• Responsibilities
• Required qualifications
• Preferred skills
• Any other relevant details"
              disabled={loading}
            />
          </div>

          <div>
            <label className="label">Job Posting URL (Optional)</label>
            <input
              type="url"
              value={jdLink}
              onChange={(e) => setJdLink(e.target.value)}
              className="input"
              placeholder="https://example.com/job-posting"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGenerate}
              disabled={loading || !jobDescription.trim()}
              className="btn btn-primary px-6"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate CV
                </>
              )}
            </button>
            <button
              onClick={handlePreview}
              disabled={loading || !jobDescription.trim()}
              className="btn btn-secondary"
            >
              Preview Content
            </button>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {preview && !result && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">CV Preview</h2>
            <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="prose prose-sm max-w-none">
            {/* Summary */}
            {preview.summary && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Professional Summary</h3>
                <p className="text-gray-700">{preview.summary}</p>
              </div>
            )}

            {/* Skills */}
            {preview.skills?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {preview.skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {preview.experience?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Experience</h3>
                {preview.experience.map((exp, idx) => (
                  <div key={idx} className="mb-4 last:mb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                        <p className="text-gray-600">{exp.company}</p>
                      </div>
                      <span className="text-sm text-gray-500">{exp.period}</span>
                    </div>
                    {exp.achievements?.length > 0 && (
                      <ul className="mt-2 space-y-1 text-gray-700">
                        {exp.achievements.map((ach, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary-500 mt-1">•</span>
                            {ach}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {preview.education?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Education</h3>
                {preview.education.map((edu, idx) => (
                  <div key={idx} className="mb-2 last:mb-0">
                    <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                    <p className="text-gray-600">{edu.institution} • {edu.graduation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {preview.certifications?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Certifications</h3>
                <ul className="space-y-1">
                  {preview.certifications.map((cert, idx) => (
                    <li key={idx} className="text-gray-700">• {cert}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-4">
              Happy with this content? Click "Generate CV" to create downloadable documents.
            </p>
            <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">
              {loading ? 'Generating...' : 'Generate CV Documents'}
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      {!result && !preview && (
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Tips for best results</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Include the complete job description with all requirements</li>
            <li>• Make sure your profile has detailed employment history and skills</li>
            <li>• The AI will highlight your most relevant experiences for this specific role</li>
            <li>• Generated CVs are saved to your history for future reference</li>
          </ul>
        </div>
      )}
    </div>
  );
}
