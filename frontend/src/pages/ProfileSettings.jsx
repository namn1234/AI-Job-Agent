import {
  useEffect,
  useState,
} from "react";
import API_BASE_URL from "../api";
import {
  useNavigate,
} from "react-router-dom";


function ProfileSettings() {
  const navigate = useNavigate();

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");


  // ---------------------------------------------
  // Load profile
  // ---------------------------------------------

  useEffect(() => {

    const fetchProfile =
      async () => {

        try {

          const response =
            await fetch(
            `${API_BASE_URL}/profile`
            );

          const data =
            await response.json();


          if (!response.ok) {

            throw new Error(
              data.detail ||
              "Failed to load profile"
            );
          }


          setProfile(data);


        } catch (error) {

          console.error(
            "Profile loading failed:",
            error
          );

          setMessage(
            error.message
          );


        } finally {

          setLoading(false);
        }
      };


    fetchProfile();

  }, []);


  // ---------------------------------------------
  // Helper for arrays
  // ---------------------------------------------

  const updateArrayField =
    (
      field,
      value
    ) => {

      const values =
        value
          .split(",")
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean);


      setProfile({
        ...profile,
        [field]: values,
      });
    };


  // ---------------------------------------------
  // Save profile
  // ---------------------------------------------

  const saveProfile =
    async () => {

      try {

        setSaving(true);

        setMessage("");


        const response =
          await fetch(
           `${API_BASE_URL}/profile`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  profile
                ),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
            "Failed to save profile"
          );
        }


        setMessage(
          "Job requirements updated successfully."
        );


      } catch (error) {

        console.error(
          "Profile save failed:",
          error
        );


        setMessage(
          `Save failed: ${error.message}`
        );


      } finally {

        setSaving(false);
      }
    };


  // ---------------------------------------------
  // Loading
  // ---------------------------------------------

  if (loading) {

    return (
      <div className="page-container">

        <div className="details-card">

          <h2>
            Loading requirements...
          </h2>

        </div>

      </div>
    );
  }


  // ---------------------------------------------
  // Error
  // ---------------------------------------------

  if (!profile) {

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
            Could not load profile
          </h2>

          <p>
            {message}
          </p>

        </div>

      </div>
    );
  }


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
          Job Search Requirements
        </h1>


        <p className="page-subtitle">
          Configure the roles and jobs
          your AI agent should search for.
        </p>

      </div>


      <div className="settings-card">


        {/* Target Roles */}

        <div className="settings-field">

          <label>
            Target Roles
          </label>

          <textarea
            rows={4}
            value={
              profile.target_roles
                .join(", ")
            }
            onChange={(event) =>
              updateArrayField(
                "target_roles",
                event.target.value
              )
            }
          />

          <small>
            Separate multiple roles with commas.
          </small>

        </div>


        {/* Locations */}

        <div className="settings-field">

          <label>
            Locations
          </label>

          <textarea
            rows={4}
            value={
              profile.locations
                .join(", ")
            }
            onChange={(event) =>
              updateArrayField(
                "locations",
                event.target.value
              )
            }
          />

        </div>


        {/* Work modes */}

        <div className="settings-field">

          <label>
            Work Modes
          </label>

          <textarea
            rows={3}
            value={
              profile.work_modes
                .join(", ")
            }
            onChange={(event) =>
              updateArrayField(
                "work_modes",
                event.target.value
              )
            }
          />

        </div>


        {/* Experience */}

        <div className="settings-field">

          <label>
            Experience Levels
          </label>

          <textarea
            rows={3}
            value={
              profile
                .experience_levels
                .join(", ")
            }
            onChange={(event) =>
              updateArrayField(
                "experience_levels",
                event.target.value
              )
            }
          />

        </div>


        {/* Skills */}

        <div className="settings-field">

          <label>
            Skills
          </label>

          <textarea
            rows={5}
            value={
              profile.skills
                .join(", ")
            }
            onChange={(event) =>
              updateArrayField(
                "skills",
                event.target.value
              )
            }
          />

        </div>


        {/* Numeric settings */}

        <div className="settings-grid">


          <div className="settings-field">

            <label>
              Minimum Salary
            </label>

            <input
              type="number"
              value={
                profile.minimum_salary
              }
              onChange={(event) =>
                setProfile({
                  ...profile,

                  minimum_salary:
                    Number(
                      event
                        .target
                        .value
                    ),
                })
              }
            />

          </div>


          <div className="settings-field">

            <label>
              Minimum Match Score
            </label>

            <input
              type="number"
              min="0"
              max="100"
              value={
                profile
                  .minimum_match_score ??
                70
              }
              onChange={(event) =>
                setProfile({
                  ...profile,

                  minimum_match_score:
                    Number(
                      event
                        .target
                        .value
                    ),
                })
              }
            />

            <small>
              Only jobs with this score
              or higher will be shown.
            </small>

          </div>


          <div className="settings-field">

            <label>
              Currency
            </label>

            <input
              type="text"
              value={
                profile.currency
              }
              onChange={(event) =>
                setProfile({
                  ...profile,

                  currency:
                    event.target.value,
                })
              }
            />

          </div>


          <div className="settings-field">

            <label>
              Search Frequency
              (hours)
            </label>

            <input
              type="number"
              min="1"
              value={
                profile
                  .search_frequency_hours
              }
              onChange={(event) =>
                setProfile({
                  ...profile,

                  search_frequency_hours:
                    Number(
                      event
                        .target
                        .value
                    ),
                })
              }
            />

          </div>

        </div>


        {/* Exclude unpaid */}

        <div className="settings-checkbox">

          <label>

            <input
              type="checkbox"
              checked={
                profile.exclude_unpaid
              }
              onChange={(event) =>
                setProfile({
                  ...profile,

                  exclude_unpaid:
                    event
                      .target
                      .checked,
                })
              }
            />

            <span>
              Exclude unpaid jobs
            </span>

          </label>

        </div>


        {/* Save */}

        <div className="settings-actions">

          <button
            className="primary-button"
            onClick={
              saveProfile
            }
            disabled={
              saving
            }
          >

            {saving
              ? "Saving..."
              : "Save Requirements"}

          </button>

        </div>


        {message && (

          <div className="settings-message">

            {message}

          </div>
        )}

      </div>

    </div>
  );
}


export default ProfileSettings;