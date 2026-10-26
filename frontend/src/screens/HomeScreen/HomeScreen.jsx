import { Link } from "react-router";
import { useAuth } from "../../shared/hooks/useAuth.js";
export default function HomeScreen() {
  const { session } = useAuth(),
    { user } = session;
  const links =
    user.role === "customer"
      ? [
          [
            "/book",
            "Book an appointment",
            "Choose a service, staff member, and available time.",
          ],
          [
            "/my-appointments",
            "My appointments",
            "Track confirmations, reschedule, or cancel.",
          ],
        ]
      : [
          [
            "/appointments",
            "Manage appointments",
            "Confirm requests and review scheduled appointments.",
          ],
          [
            "/queue",
            "Live queue",
            "Check in arrivals, call the next customer, and finish service.",
          ],
          ...(user.role === "admin"
            ? [
                [
                  "/services",
                  "Services",
                  "Manage prices, durations, and active services.",
                ],
                [
                  "/staff",
                  "Staff & schedules",
                  "Assign qualifications, weekly hours, and days off.",
                ],
                [
                  "/dashboard",
                  "Dashboard",
                  "Review bookings, completed revenue, and appointment volume.",
                ],
              ]
            : []),
        ];
  return (
    <main>
      <p className="eyebrow">Your workspace</p>
      <h1>Welcome, {user.fullName}</h1>
      <p>Everything you need to manage your appointments in one place.</p>
      <div className="home-grid">
        {links.map(([path, title, description]) => (
          <Link className="home-card" to={path} key={path}>
            <h2>
              {title}
              <span aria-hidden="true">↗</span>
            </h2>
            <p>{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
