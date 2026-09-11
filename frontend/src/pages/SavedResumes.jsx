import {
  useEffect,
  useState,
} from "react";
import API_BASE_URL from "../api";
import {
  useNavigate,
} from "react-router-dom";


function SavedResumes() {
  const navigate = useNavigate();

  const [resumes, setResumes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ---------------------------------------------
  // Load saved resumes
  // ---------------------------------------------

  useEffect(() => {

    const fetchResumes = async () => {

      try {

        const response = await fetch(
        `${API_BASE_URL}/resumes/all`
        );

        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
            "Failed to load resumes"
          );
        }


        setResumes(
          data.resumes || []
        );


      } catch (error) {

        console.error(
          "Resume loading failed:",
          error
        );

        setError(
          error.message
        );


      } finally {

        setLoading(false);
      }
    };


    fetchResumes();

  }, []);


  // ---------------------------------------------
  // Open resume
  // ---------------------------------------------

  const openResume = (item) => {

    navigate(
      "/resume-preview",
      {
        state: {
          resume:
            item.resume,

          jobUrl:
            item.job_url,

          jobTitle:
            item.resume
              ?.target_job_title,
        },
      }
    );
  };


  // ---------------------------------------------
  // UI
  // ---------------------------------------------

  return (

    <div className="page-container">


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
          Saved Resumes
        </h1>


        <p className="page-subtitle">
          Review and download your tailored resumes.
        </p>

      </div>


      {loading ? (

        <div className="details-card">

          <p>
            Loading resumes...
          </p>

        </div>

      ) : error ? (

        <div className="details-card">

          <p className="status-rejected">
            {error}
          </p>

        </div>

      ) : resumes.length === 0 ? (

        <div className="details-card">

          <h3>
            No saved resumes yet
          </h3>

          <p>
            Generate and save a tailored resume
            from a job details page.
          </p>

        </div>

      ) : (

        <div className="saved-resume-grid">

          {resumes.map(
            (item, index) => {

              const resume =
                item.resume || {};


              return (

                <div
                  key={
                    item.job_url ||
                    index
                  }
                  className="saved-resume-card"
                >

                  <div className="saved-resume-header">

                    <div>

                      <h3>
                        {
                          resume
                            .target_job_title ||
                          "Tailored Resume"
                        }
                      </h3>

                      <p>
                        Saved Resume
                      </p>

                    </div>


                    <span className="resume-badge">
                      CV
                    </span>

                  </div>


                  <div className="saved-resume-section">

                    <div className="details-label">
                      Professional Summary
                    </div>

                    <p>
                      {
                        resume
                          .professional_summary ||
                        "No summary available."
                      }
                    </p>

                  </div>


                  <div className="saved-resume-section">

                    <div className="details-label">
                      Skills
                    </div>

                    <div className="skill-tags">

                      {(
                        resume.skills ||
                        []
                      )
                        .slice(0, 8)
                        .map(
                          (
                            skill,
                            skillIndex
                          ) => (

                            <span
                              key={
                                skillIndex
                              }
                              className="skill-tag"
                            >
                              {skill}
                            </span>

                          )
                        )}

                    </div>

                  </div>


                  <div className="saved-resume-actions">

                    <button
                      className="primary-button"
                      onClick={() =>
                        openResume(item)
                      }
                    >
                      Open Resume
                    </button>


                    <button
                      className="secondary-button"
                      onClick={() =>
                        window.open(
                         `${API_BASE_URL}/resumes/download/pdf?job_url=${encodeURIComponent(
                            item.job_url
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      PDF
                    </button>


                    <button
                      className="secondary-button"
                      onClick={() =>
                        window.open(
                          `${API_BASE_URL}/resumes/download/docx?job_url=${encodeURIComponent(
                            item.job_url
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      DOCX
                    </button>

                  </div>

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}


export default SavedResumes;