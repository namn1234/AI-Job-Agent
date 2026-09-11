import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";


function JobDetails() {

  const location = useLocation();
  const navigate = useNavigate();

  const params =
    new URLSearchParams(
      location.search
    );

  const jobUrl =
    params.get("url");


  const [job, setJob] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    generatingResume,
    setGeneratingResume,
  ] = useState(false);

  const [
    resumeError,
    setResumeError,
  ] = useState("");


  // --------------------------------------------------
  // Load job
  // --------------------------------------------------

  useEffect(() => {

    const fetchJob = async () => {

      try {

        const response =
          await fetch(
            `http://127.0.0.1:8000/job-details?url=${encodeURIComponent(
              jobUrl
            )}`
          );

        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
            "Job not found"
          );
        }


        setJob(data);

      } catch (error) {

        console.error(
          "Failed to load job:",
          error
        );

        setJob(null);

      } finally {

        setLoading(false);
      }
    };


    if (jobUrl) {

      fetchJob();

    } else {

      setLoading(false);
    }

  }, [jobUrl]);


  // --------------------------------------------------
  // Generate resume
  // --------------------------------------------------

  const generateResume =
    async () => {

      if (!job) {
        return;
      }


      try {

        setGeneratingResume(true);

        setResumeError("");


        const response =
          await fetch(
            `http://127.0.0.1:8000/jobs/generate-resume?url=${encodeURIComponent(
              job.url
            )}`,
            {
              method: "POST",
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
            "Resume generation failed"
          );
        }


        navigate(
          "/resume-preview",
          {
            state: {
              resume:
                data.resume,

              jobUrl:
                job.url,

              jobTitle:
                job.title,

              company:
                job.company,
            },
          }
        );

      } catch (error) {

        console.error(
          "Resume generation failed:",
          error
        );

        setResumeError(
          error.message
        );

      } finally {

        setGeneratingResume(false);
      }
    };


  // --------------------------------------------------
  // Mark applied
  // --------------------------------------------------

  const markApplied =
    async () => {

      try {

        const response =
          await fetch(
            `http://127.0.0.1:8000/jobs/mark-applied?url=${encodeURIComponent(
              job.url
            )}`,
            {
              method: "PUT",
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
            "Could not mark job as applied"
          );
        }


        setJob(
          (previousJob) => ({
            ...previousJob,
            applied: true,
            rejected: false,
          })
        );


      } catch (error) {

        console.error(
          "Applied update failed:",
          error
        );

        alert(
          error.message
        );
      }
    };


  // --------------------------------------------------
  // Reject job
  // --------------------------------------------------

  const rejectJob =
    async () => {

      try {

        const response =
          await fetch(
            `http://127.0.0.1:8000/jobs/reject?url=${encodeURIComponent(
              job.url
            )}`,
            {
              method: "PUT",
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
            "Could not reject job"
          );
        }


        setJob(
          (previousJob) => ({
            ...previousJob,
            rejected: true,
            applied: false,
          })
        );


      } catch (error) {

        console.error(
          "Reject update failed:",
          error
        );

        alert(
          error.message
        );
      }
    };


  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {

    return (
      <div className="page-container">

        <div className="details-card">

          <h2>
            Loading job...
          </h2>

        </div>

      </div>
    );
  }


  // --------------------------------------------------
  // Not found
  // --------------------------------------------------

  if (!job) {

    return (
      <div className="page-container">

        <button
          className="secondary-button"
          onClick={() =>
            navigate("/")
          }
        >
          ← Dashboard
        </button>

        <div
          className="details-card"
          style={{
            marginTop: "20px",
          }}
        >

          <h2>
            Job not found
          </h2>

          <p>
            The selected job could not be loaded.
          </p>

        </div>

      </div>
    );
  }


  // --------------------------------------------------
  // Page
  // --------------------------------------------------

  return (

    <div className="page-container">


      {/* Header */}

      <div className="page-header">

        <button
          className="secondary-button"
          onClick={() =>
            navigate("/")
          }
        >
          ← Dashboard
        </button>


        <h1 className="page-title">
          {job.title}
        </h1>


        <p className="page-subtitle">
          {job.company}
        </p>

      </div>


      {/* Basic job information */}

      <div className="details-card">

        <h2 className="section-title">
          Job Information
        </h2>


        <div className="details-grid">

          <div>

            <div className="details-label">
              Location
            </div>

            <div className="details-value">
              {job.location || "Not provided"}
            </div>

          </div>


          <div>

            <div className="details-label">
              Work Mode
            </div>

            <div className="details-value">
              {job.work_mode || "Not provided"}
            </div>

          </div>


          <div>

            <div className="details-label">
              Experience
            </div>

            <div className="details-value">
              {job.experience || "Not provided"}
            </div>

          </div>


          <div>

            <div className="details-label">
              Salary
            </div>

            <div className="details-value">

              {job.salary
                ? `${job.salary} ${
                    job.currency || ""
                  }`
                : "Not provided"}

            </div>

          </div>


          <div>

            <div className="details-label">
              Source
            </div>

            <div className="details-value">
              {job.source || "Not provided"}
            </div>

          </div>

        </div>

      </div>


      {/* Match Analysis */}

      <div className="details-card">

        <h2 className="section-title">
          Match Analysis
        </h2>


        <p>
          <strong>
            Rule Match:
          </strong>{" "}

          <span className="score-badge">
            {job.rule_match_score ?? 0}%
          </span>
        </p>


        <p>
          <strong>
            AI Match:
          </strong>{" "}

          <span className="score-badge">
            {job.ai_match_score ??
              job.rule_match_score ??
              0}
            %
          </span>
        </p>


        <p>
          <strong>
            Recommendation:
          </strong>{" "}

          {job.ai_recommendation ||
            "Maybe"}
        </p>


        {job.applied && (

          <p className="status-applied">
            ✅ Job marked as applied
          </p>
        )}


        {job.rejected && (

          <p className="status-rejected">
            ❌ Job rejected
          </p>
        )}

      </div>


      {/* Why this job matches */}

      <div className="details-card">

        <h2 className="section-title">
          Why This Job Matches
        </h2>


        {job.ai_reasons?.length > 0 ? (

          <ul>

            {job.ai_reasons.map(
              (reason, index) => (

                <li key={index}>
                  {reason}
                </li>
              )
            )}

          </ul>

        ) : (

          <p>
            No AI explanation available.
          </p>
        )}

      </div>


      {/* Matching Skills */}

      <div className="details-card">

        <h2 className="section-title">
          Matching Skills
        </h2>


        {job.ai_matching_skills
          ?.length > 0 ? (

          <ul>

            {job.ai_matching_skills.map(
              (skill, index) => (

                <li key={index}>
                  {skill}
                </li>
              )
            )}

          </ul>

        ) : (

          <p>
            No matching skills available.
          </p>
        )}

      </div>


      {/* Missing Skills */}

      <div className="details-card">

        <h2 className="section-title">
          Missing Skills
        </h2>


        {job.ai_missing_skills
          ?.length > 0 ? (

          <ul>

            {job.ai_missing_skills.map(
              (skill, index) => (

                <li key={index}>
                  {skill}
                </li>
              )
            )}

          </ul>

        ) : (

          <p>
            No major missing skills.
          </p>
        )}

      </div>


      {/* Experience Warning */}

      {job.experience_warning && (

        <div className="details-card">

          <h2 className="section-title">
            Experience Warning
          </h2>

          <p>
            {job.experience_warning}
          </p>

        </div>
      )}


      {/* Job Description */}

      <div className="details-card">

        <h2 className="section-title">
          Job Description
        </h2>


        {job.description ? (

          <div
            dangerouslySetInnerHTML={{
              __html:
                job.description,
            }}
          />

        ) : (

          <p>
            No job description available.
          </p>
        )}

      </div>


      {/* Actions */}

      <div className="details-card">

        <h2 className="section-title">
          Actions
        </h2>


        <div className="action-row">

          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
          >

            <button className="secondary-button">
              View Original Job
            </button>

          </a>


          <button
            className="primary-button"
            onClick={
              generateResume
            }
            disabled={
              generatingResume
            }
          >

            {generatingResume
              ? "Generating..."
              : "Generate Resume"}

          </button>


          <button
            className="success-button"
            onClick={
              markApplied
            }
            disabled={
              job.applied
            }
          >

            {job.applied
              ? "Applied ✓"
              : "Mark Applied"}

          </button>


          <button
            className="danger-button"
            onClick={
              rejectJob
            }
            disabled={
              job.rejected
            }
          >

            {job.rejected
              ? "Rejected ✓"
              : "Reject"}

          </button>

        </div>

      </div>


      {/* Resume error */}

      {resumeError && (

        <div
          className="details-card"
          style={{
            border:
              "1px solid #dc2626",
          }}
        >

          <strong className="status-rejected">
            Resume generation failed
          </strong>

          <p>
            {resumeError}
          </p>

        </div>
      )}

    </div>
  );
}


export default JobDetails;