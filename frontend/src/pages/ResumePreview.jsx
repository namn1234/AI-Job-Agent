import {
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";


function ResumePreview() {

  const location =
    useLocation();

  const navigate =
    useNavigate();


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

      <div
        style={{
          padding: "40px",
        }}
      >

        <h2>
          No resume data found
        </h2>

        <button
          onClick={() =>
            navigate("/")
          }
        >
          Back to Dashboard
        </button>

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

      const updatedProjects =
        [
          ...(resume.projects ||
            [])
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
            "http://127.0.0.1:8000/resumes/save",
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
  // Page
  // --------------------------------------------------

  return (

    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px",
      }}
    >

      <button
        onClick={() =>
          navigate(-1)
        }
      >
        ← Back
      </button>


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


      <hr />


      <h2>
        {
          resume.target_job_title
        }
      </h2>


      {/* Summary */}

      <h3>
        Professional Summary
      </h3>


      <textarea
        value={
          resume
            .professional_summary ||
          ""
        }
        onChange={
          updateSummary
        }
        rows={6}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
        }}
      />


      {/* Skills */}

      <h3>
        Skills
      </h3>


      {(resume.skills || []).map(
        (
          skill,
          index
        ) => (

          <div
            key={index}
            style={{
              marginBottom:
                "8px",
            }}
          >

            <input
              type="text"
              value={skill}
              onChange={(
                event
              ) =>
                updateSkill(
                  index,
                  event.target
                    .value
                )
              }
              style={{
                width: "100%",
                padding: "8px",
              }}
            />

          </div>
        )
      )}


      {/* Projects */}

      <h3>
        Projects
      </h3>


      {(resume.projects || []).map(
        (
          project,
          projectIndex
        ) => (

          <div
            key={projectIndex}
            style={{
              padding: "15px",
              border:
                "1px solid #ddd",
              marginBottom:
                "20px",
            }}
          >

            <h4>
              {project.name}
            </h4>


            <p>

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
                  value={point}
                  onChange={(
                    event
                  ) =>
                    updateProjectBullet(
                      projectIndex,
                      bulletIndex,
                      event
                        .target
                        .value
                    )
                  }
                  rows={3}
                  style={{
                    width:
                      "100%",
                    padding:
                      "8px",
                    marginBottom:
                      "8px",
                  }}
                />
              )
            )}

          </div>
        )
      )}


      {/* Education */}

      <h3>
        Education
      </h3>


      <ul>

        {(
          resume.education || []
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
                  }`}

            </li>
          )
        )}

      </ul>


      {/* Certifications */}

      <h3>
        Certifications
      </h3>


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


      {/* ATS */}

      <h3>
        ATS Keywords
      </h3>


      <p>

        {(
          resume
            .ats_keywords ||
          []
        ).join(", ")}

      </p>


      <hr />


      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "25px",
        }}
      >

        <button
          onClick={
            saveResume
          }
          disabled={saving}
        >

          {saving
            ? "Saving..."
            : "Save Resume"}

        </button>


       <button
  onClick={() => {
    window.open(
      `http://127.0.0.1:8000/resumes/download/pdf?job_url=${encodeURIComponent(
        jobUrl
      )}`,
      "_blank"
    );
  }}
>
  Download PDF
</button>

<button
  onClick={() => {
    window.open(
      `http://127.0.0.1:8000/resumes/download/docx?job_url=${encodeURIComponent(
        jobUrl
      )}`,
      "_blank"
    );
  }}
>
  Download DOCX
</button>

      </div>


      {saveMessage && (

        <p
          style={{
            marginTop: "15px",
            fontWeight: "bold",
          }}
        >
          {saveMessage}
        </p>
      )}

    </div>
  );
}


export default ResumePreview;