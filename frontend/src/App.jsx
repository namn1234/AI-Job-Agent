import {
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import NotificationBell from "./components/NotificationBell";
import JobDetails from "./pages/JobDetails";
import ResumePreview from "./pages/ResumePreview";
import ProfileSettings from "./pages/ProfileSettings";
import SavedResumes from "./pages/SavedResumes";

import "./App.css";


function Dashboard() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [workModeFilter, setWorkModeFilter] =
    useState("all");

  const [scoreFilter, setScoreFilter] =
    useState(0);


  // --------------------------------------------------
  // Load saved jobs
  // --------------------------------------------------

  const fetchJobs = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/saved-jobs"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Failed to load jobs"
        );
      }

      setJobs(
        data.jobs || []
      );

    } catch (error) {
      console.error(
        "Failed to load jobs:",
        error
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchJobs();
  }, []);


  // --------------------------------------------------
  // Search jobs manually
  // --------------------------------------------------

  const searchJobsNow = async () => {
    try {
      setSearching(true);

      const response = await fetch(
        "http://127.0.0.1:8000/jobs"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Job search failed"
        );
      }

      await fetchJobs();

      alert(
        `Search completed. ${data.total_jobs} matching jobs found.`
      );

    } catch (error) {
      console.error(
        "Job search failed:",
        error
      );

      alert(
        error.message
      );

    } finally {
      setSearching(false);
    }
  };


  // --------------------------------------------------
  // Open job details
  // --------------------------------------------------

  const openJob = (job) => {
    navigate(
      `/job?url=${encodeURIComponent(
        job.url
      )}`
    );
  };


  // --------------------------------------------------
  // Dashboard filtering
  // --------------------------------------------------

  const filteredJobs =
    jobs.filter((job) => {

      // Status
      if (
        activeFilter === "applied" &&
        !job.applied
      ) {
        return false;
      }

      if (
        activeFilter === "rejected" &&
        !job.rejected
      ) {
        return false;
      }

      if (
        activeFilter === "active" &&
        (
          job.applied ||
          job.rejected
        )
      ) {
        return false;
      }


      // Role
      if (
        roleFilter !== "all" &&
        !job.title
          .toLowerCase()
          .includes(
            roleFilter.toLowerCase()
          )
      ) {
        return false;
      }


      // Work mode
      if (
        workModeFilter !== "all" &&
        job.work_mode !== workModeFilter
      ) {
        return false;
      }


      // Score
      const score =
        job.ai_match_score ??
        job.rule_match_score ??
        0;

      if (
        score < scoreFilter
      ) {
        return false;
      }


      return true;
    });


  // --------------------------------------------------
  // Counts
  // --------------------------------------------------

  const totalJobs =
    jobs.length;

  const activeJobs =
    jobs.filter(
      (job) =>
        !job.applied &&
        !job.rejected
    ).length;

  const appliedJobs =
    jobs.filter(
      (job) =>
        job.applied
    ).length;

  const rejectedJobs =
    jobs.filter(
      (job) =>
        job.rejected
    ).length;


  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="dashboard-container">

      {/* Header */}

      <header className="dashboard-header">

        <div className="dashboard-title">
          <h1>
            AI Job Agent
          </h1>

          <p>
            AI-powered job matching dashboard
          </p>
        </div>


        <div className="dashboard-actions">

          <button
            className="secondary-button"
            onClick={() =>
              navigate("/settings")
            }
          >
            Edit Requirements
          </button>


          <button
            className="secondary-button"
            onClick={() =>
              navigate("/saved-resumes")
            }
          >
            Saved Resumes
          </button>


          <button
            className="primary-button"
            onClick={searchJobsNow}
            disabled={searching}
          >
            {searching
              ? "Searching..."
              : "Search Jobs Now"}
          </button>


          <NotificationBell />

        </div>

      </header>


      <hr />


      {/* Statistics */}

      <div className="stats-grid">

        <div className="stat-card">
          <h3>
            Total Jobs
          </h3>

          <div className="stat-number">
            {totalJobs}
          </div>
        </div>


        <div className="stat-card">
          <h3>
            Active
          </h3>

          <div className="stat-number">
            {activeJobs}
          </div>
        </div>


        <div className="stat-card">
          <h3>
            Applied
          </h3>

          <div className="stat-number">
            {appliedJobs}
          </div>
        </div>


        <div className="stat-card">
          <h3>
            Rejected
          </h3>

          <div className="stat-number">
            {rejectedJobs}
          </div>
        </div>

      </div>


      {/* Status Filters */}

      <div className="filter-row">

        <button
          className="filter-button"
          onClick={() =>
            setActiveFilter("all")
          }
          disabled={
            activeFilter === "all"
          }
        >
          All
        </button>


        <button
          className="filter-button"
          onClick={() =>
            setActiveFilter("active")
          }
          disabled={
            activeFilter === "active"
          }
        >
          Active
        </button>


        <button
          className="filter-button"
          onClick={() =>
            setActiveFilter("applied")
          }
          disabled={
            activeFilter === "applied"
          }
        >
          Applied
        </button>


        <button
          className="filter-button"
          onClick={() =>
            setActiveFilter("rejected")
          }
          disabled={
            activeFilter === "rejected"
          }
        >
          Rejected
        </button>

      </div>


      {/* Advanced Filters */}

      <div className="filter-row">

        <select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Roles
          </option>

          <option value="mern">
            MERN
          </option>

          <option value="full stack">
            Full Stack
          </option>

          <option value="ai">
            AI
          </option>
        </select>


        <select
          value={workModeFilter}
          onChange={(event) =>
            setWorkModeFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Work Modes
          </option>

          <option value="On-site">
            On-site
          </option>

          <option value="Remote">
            Remote
          </option>

          <option value="Hybrid">
            Hybrid
          </option>
        </select>


        <select
          value={scoreFilter}
          onChange={(event) =>
            setScoreFilter(
              Number(
                event.target.value
              )
            )
          }
        >
          <option value={0}>
            Any Score
          </option>

          <option value={70}>
            70%+
          </option>

          <option value={80}>
            80%+
          </option>

          <option value={90}>
            90%+
          </option>
        </select>

      </div>


      {/* Jobs */}

      <h2>
        Matched Jobs
      </h2>


      {loading ? (

        <p>
          Loading jobs...
        </p>

      ) : filteredJobs.length === 0 ? (

        <p>
          No jobs in this category.
        </p>

      ) : (

        <div className="jobs-grid">

          {filteredJobs.map(
            (job) => {

              const score =
                job.ai_match_score ??
                job.rule_match_score ??
                0;


              return (

                <div
                  key={job.url}
                  className="job-card"
                >

                  <h3>
                    {job.title}
                  </h3>


                  <p>
                    <strong>
                      {job.company}
                    </strong>
                  </p>


                  <p className="job-meta">
                    📍 {job.location}
                    {" • "}
                    {job.work_mode}
                  </p>


                  <p className="job-score">
                    Match: {score}%
                  </p>


                  <p>
                    Recommendation:{" "}

                    <strong>
                      {
                        job.ai_recommendation ||
                        "Maybe"
                      }
                    </strong>
                  </p>


                  {job.applied && (

                    <p className="status-applied">
                      ✅ Applied
                    </p>
                  )}


                  {job.rejected && (

                    <p className="status-rejected">
                      ❌ Rejected
                    </p>
                  )}


                  {!job.applied &&
                    !job.rejected && (

                      <p className="status-active">
                        🟢 Active
                      </p>
                    )}


                  <button
                    className="primary-button"
                    onClick={() =>
                      openJob(job)
                    }
                  >
                    View Details
                  </button>

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}


function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={
          <Dashboard />
        }
      />


      <Route
        path="/settings"
        element={
          <ProfileSettings />
        }
      />


      <Route
        path="/saved-resumes"
        element={
          <SavedResumes />
        }
      />


      <Route
        path="/job"
        element={
          <JobDetails />
        }
      />


      <Route
        path="/resume-preview"
        element={
          <ResumePreview />
        }
      />

    </Routes>
  );
}


export default App;