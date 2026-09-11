import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


function SavedResumes() {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/resumes/all"
        );

        const data = await response.json();

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

      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, []);


  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px",
      }}
    >

      <button
        onClick={() =>
          navigate("/")
        }
      >
        ← Dashboard
      </button>


      <h1>
        Saved Resumes
      </h1>


      {loading ? (

        <p>
          Loading resumes...
        </p>

      ) : resumes.length === 0 ? (

        <p>
          No saved resumes yet.
        </p>

      ) : (

        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >

          {resumes.map(
            (item, index) => (

              <div
                key={index}
                style={{
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    "10px",
                  padding: "20px",
                }}
              >

                <h3>
                  {
                    item.resume
                      ?.target_job_title ||
                    "Tailored Resume"
                  }
                </h3>


                <p>
                  <strong>
                    Job URL:
                  </strong>{" "}

                  {item.job_url}
                </p>


                <p>
                  <strong>
                    Summary:
                  </strong>{" "}

                  {
                    item.resume
                      ?.professional_summary ||
                    "No summary"
                  }
                </p>


                <p>
                  <strong>
                    Skills:
                  </strong>{" "}

                  {(
                    item.resume
                      ?.skills ||
                    []
                  ).join(", ")}
                </p>


                <button
                  onClick={() =>
                    navigate(
                      "/resume-preview",
                      {
                        state: {
                          resume:
                            item.resume,

                          jobUrl:
                            item.job_url,
                        },
                      }
                    )
                  }
                >
                  Open Resume
                </button>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}


export default SavedResumes;