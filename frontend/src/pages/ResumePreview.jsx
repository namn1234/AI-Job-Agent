import {
  useState,
} from "react";
import API_BASE_URL from "../api";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";


function ResumePreview() {

  const location = useLocation();
  const navigate = useNavigate();

  const initialResume =
    location.state?.resume;

  const jobUrl =
    location.state?.jobUrl;

  const jobTitle =
    location.state?.jobTitle;

  const company =
    location.state?.company;


  const [resume, setResume] =
    useState(initialResume);

  const [saving, setSaving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");


  // --------------------------------------------------
  // No resume
  // --------------------------------------------------

  if (!resume) {

    return (
      <div className="page-container">

        <div className="resume-document">

          <h2>
            No resume data found
          </h2>

          <button
            className="secondary-button"
            onClick={() =>
              navigate("/")
            }
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }


  // --------------------------------------------------
  // Update summary
  // --------------------------------------------------

  const updateSummary =
    (event) => {

      setResume({
        ...resume,

        professional_summary:
          event.target.value,
      });
    };


  // --------------------------------------------------
  // Update skill
  // --------------------------------------------------

  const updateSkill =
    (
      index,
      value
    ) => {

      const updatedSkills = [
        ...(resume.skills || [])
      ];

      updatedSkills[index] =
        value;

      setResume({
        ...resume,
        skills:
          updatedSkills,
      });
    };


  // --------------------------------------------------
  // Update project bullet
  // --------------------------------------------------

  const updateProjectBullet =
    (
      projectIndex,
      bulletIndex,
      value
    ) => {

      const updatedProjects = [
        ...(resume.projects || [])
      ];


      const updatedProject = {
        ...updatedProjects[
          projectIndex
        ],
      };


      const updatedBullets = [
        ...(updatedProject
          .bullet_points || [])
      ];


      updatedBullets[
        bulletIndex
      ] = value;


      updatedProject
        .bullet_points =
        updatedBullets;


      updatedProjects[
        projectIndex
      ] =
        updatedProject;


      setResume({
        ...resume,

        projects:
          updatedProjects,
      });
    };


  // --------------------------------------------------
  // Save resume
  // --------------------------------------------------

  const saveResume =
    async () => {

      if (!jobUrl) {

        alert(
          "Job URL is missing."
        );

        return;
      }


      try {

        setSaving(true);

        setSaveMessage("");


        const response =
          await fetch(
            `${API_BASE_URL}/resumes/save`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  job_url:
                    jobUrl,

                  resume:
                    resume,
                }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
            "Failed to save resume"
          );
        }


        setSaveMessage(
          "Resume saved successfully."
        );


      } catch (error) {

        console.error(
          "Resume save failed:",
          error
        );


        setSaveMessage(
          `Save failed: ${error.message}`
        );


      } finally {

        setSaving(false);
      }
    };


  // --------------------------------------------------
  // Download PDF
  // --------------------------------------------------

  const downloadPDF = () => {

    if (!jobUrl) {
      alert(
        "Please save the resume first."
      );
      return;
    }

    window.open(
     `${API_BASE_URL}/resumes/download/pdf?job_url=${encodeURIComponent(
        jobUrl
      )}`,
      "_blank"
    );
  };


  // --------------------------------------------------
  // Download DOCX
  // --------------------------------------------------

  const downloadDOCX = () => {

    if (!jobUrl) {
      alert(
        "Please save the resume first."
      );
      return;
    }

    window.open(
     `${API_BASE_URL}/resumes/download/docx?job_url=${encodeURIComponent(
        jobUrl
      )}`,
      "_blank"
    );
  };


  // --------------------------------------------------
  // Page
  // --------------------------------------------------

  return (

    <div className="resume-page">


      {/* Top controls */}

      <div className="resume-topbar">

        <button
          className="secondary-button"
          onClick={() =>
            navigate(-1)
          }
        >
          ← Back
        </button>


        <div className="resume-top-actions">

          <button
            className="primary-button"
            onClick={
              saveResume
            }
            disabled={
              saving
            }
          >
            {saving
              ? "Saving..."
              : "Save Resume"}
          </button>


          <button
            className="secondary-button"
            onClick={
              downloadPDF
            }
          >
            Download PDF
          </button>


          <button
            className="secondary-button"
            onClick={
              downloadDOCX
            }
          >
            Download DOCX
          </button>

        </div>

      </div>


      {/* Target information */}

      <div className="resume-target">

        <h1>
          Tailored Resume
        </h1>

        {jobTitle && (

          <p>
            <strong>
              Target Job:
            </strong>{" "}

            {jobTitle}
          </p>
        )}


        {company && (

          <p>
            <strong>
              Company:
            </strong>{" "}

            {company}
          </p>
        )}

      </div>


      {/* Resume */}

      <div className="resume-document">


        {/* Resume header */}

        <div className="resume-header">

          <h1>
            {resume.name ||
              "Ismail Khan"}
          </h1>

          <p>
            {resume.target_job_title ||
              jobTitle ||
              "Software Engineer"}
          </p>

        </div>


        {/* Professional Summary */}

        <section className="resume-section">

          <h2>
            Professional Summary
          </h2>

          <textarea
            className="resume-textarea resume-summary"
            value={
              resume
                .professional_summary ||
              ""
            }
            onChange={
              updateSummary
            }
            rows={6}
          />

        </section>


        {/* Skills */}

        <section className="resume-section">

          <h2>
            Skills
          </h2>

          <div className="resume-skills">

            {(resume.skills || []).map(
              (
                skill,
                index
              ) => (

                <input
                  key={index}
                  className="resume-skill-input"
                  type="text"
                  value={
                    skill
                  }
                  onChange={(
                    event
                  ) =>
                    updateSkill(
                      index,
                      event.target.value
                    )
                  }
                />

              )
            )}

          </div>

        </section>


        {/* Projects */}

        <section className="resume-section">

          <h2>
            Projects
          </h2>


          {(resume.projects || []).map(
            (
              project,
              projectIndex
            ) => (

              <div
                className="resume-project"
                key={
                  projectIndex
                }
              >

                <h3>
                  {project.name}
                </h3>


                <p className="resume-technologies">

                  <strong>
                    Technologies:
                  </strong>{" "}

                  {(
                    project
                      .technologies ||
                    []
                  ).join(", ")}

                </p>


                {(
                  project
                    .bullet_points ||
                  []
                ).map(
                  (
                    point,
                    bulletIndex
                  ) => (

                    <textarea
                      key={
                        bulletIndex
                      }
                      className="resume-textarea resume-bullet"
                      value={
                        point
                      }
                      onChange={(
                        event
                      ) =>
                        updateProjectBullet(
                          projectIndex,
                          bulletIndex,
                          event.target.value
                        )
                      }
                      rows={3}
                    />

                  )
                )}

              </div>

            )
          )}

        </section>


        {/* Education */}

        <section className="resume-section">

          <h2>
            Education
          </h2>

          <ul>

            {(
              resume.education ||
              []
            ).map(
              (
                education,
                index
              ) => (

                <li key={index}>

                  {typeof education ===
                  "string"

                    ? education

                    : `${
                        education.degree ||
                        ""
                      }${
                        education
                          .university
                          ? ` - ${education.university}`
                          : ""
                      }`
                  }

                </li>

              )
            )}

          </ul>

        </section>


        {/* Certifications */}

        <section className="resume-section">

          <h2>
            Certifications
          </h2>

          <ul>

            {(
              resume
                .certifications ||
              []
            ).map(
              (
                certification,
                index
              ) => (

                <li key={index}>
                  {
                    certification
                  }
                </li>

              )
            )}

          </ul>

        </section>


        {/* ATS Keywords */}

        <section className="resume-section">

          <h2>
            ATS Keywords
          </h2>

          <p className="ats-keywords">

            {(
              resume
                .ats_keywords ||
              []
            ).join(", ")}

          </p>

        </section>


      </div>


      {/* Bottom actions */}

      <div className="resume-bottom-actions">

        <button
          className="primary-button"
          onClick={
            saveResume
          }
          disabled={
            saving
          }
        >
          {saving
            ? "Saving..."
            : "Save Resume"}
        </button>


        <button
          className="secondary-button"
          onClick={
            downloadPDF
          }
        >
          Download PDF
        </button>


        <button
          className="secondary-button"
          onClick={
            downloadDOCX
          }
        >
          Download DOCX
        </button>

      </div>


      {saveMessage && (

        <div className="resume-save-message">
          {saveMessage}
        </div>
      )}

    </div>
  );
}


export default ResumePreview;