import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";


function NotificationBell() {
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState([]);

  const [unread, setUnread] =
    useState(0);

  const [open, setOpen] =
    useState(false);


  // ---------------------------------------------
  // Load notifications
  // ---------------------------------------------

  const fetchNotifications =
    async () => {

      try {

        const response =
          await fetch(
            "http://127.0.0.1:8000/notifications"
          );

        if (!response.ok) {
          throw new Error(
            "Failed to load notifications"
          );
        }

        const data =
          await response.json();

        setNotifications(
          data.notifications || []
        );

        setUnread(
          data.unread || 0
        );

      } catch (error) {

        console.error(
          "Notification error:",
          error
        );
      }
    };


  useEffect(() => {

    fetchNotifications();

    const interval =
      setInterval(
        fetchNotifications,
        30000
      );

    return () =>
      clearInterval(interval);

  }, []);


  // ---------------------------------------------
  // Mark one as read
  // ---------------------------------------------

  const markAsRead =
    async (notificationId) => {

      try {

        const response =
          await fetch(
            `http://127.0.0.1:8000/notifications/${notificationId}/read`,
            {
              method: "PUT",
            }
          );

        if (response.ok) {
          await fetchNotifications();
        }

      } catch (error) {

        console.error(
          "Mark-as-read error:",
          error
        );
      }
    };


  // ---------------------------------------------
  // Open notification
  // ---------------------------------------------

  const openNotification =
    async (notification) => {

      if (!notification.read) {
        await markAsRead(
          notification._id
        );
      }

      setOpen(false);

      navigate(
        `/job?url=${encodeURIComponent(
          notification.job_url
        )}`
      );
    };


  // ---------------------------------------------
  // Mark all as read
  // ---------------------------------------------

  const markAllRead =
    async () => {

      try {

        const response =
          await fetch(
            "http://127.0.0.1:8000/notifications/read-all",
            {
              method: "PUT",
            }
          );

        if (response.ok) {
          await fetchNotifications();
        }

      } catch (error) {

        console.error(
          "Mark-all-read error:",
          error
        );
      }
    };


  // ---------------------------------------------
  // UI
  // ---------------------------------------------

  return (

    <div className="notification-wrapper">

      <button
        className="notification-button"
        onClick={() =>
          setOpen(!open)
        }
      >
        🔔

        {unread > 0 && (

          <span className="notification-badge">
            {unread}
          </span>
        )}

      </button>


      {open && (

        <div className="notification-panel">

          <div className="notification-panel-header">

            <div>
              <h3>
                Notifications
              </h3>

              <p>
                {unread} unread
              </p>
            </div>


            {unread > 0 && (

              <button
                className="notification-read-all"
                onClick={
                  markAllRead
                }
              >
                Mark all read
              </button>
            )}

          </div>


          <div className="notification-list">

            {notifications.length === 0 ? (

              <div className="notification-empty">
                No notifications yet.
              </div>

            ) : (

              notifications.map(
                (notification) => (

                  <div
                    key={
                      notification._id
                    }
                    className={
                      notification.read
                        ? "notification-item"
                        : "notification-item unread"
                    }
                    onClick={() =>
                      openNotification(
                        notification
                      )
                    }
                  >

                    <div className="notification-item-top">

                      <strong>
                        {notification.title}
                      </strong>

                      {!notification.read && (
                        <span className="unread-dot" />
                      )}

                    </div>


                    <p className="notification-company">
                      {notification.company}
                    </p>


                    <p className="notification-meta">
                      {notification.location}
                      {" • "}
                      {notification.work_mode}
                    </p>


                    <div className="notification-footer">

                      <span>
                        Match{" "}
                        {notification.match_score}%
                      </span>

                      <span>
                        {notification.recommendation}
                      </span>

                    </div>

                  </div>
                )
              )
            )}

          </div>

        </div>
      )}

    </div>
  );
}


export default NotificationBell;