# Frontend

React JavaScript with Vite. Follow the root README for complete setup, backend configuration, roles and verification.

From the repository root, run `npm --prefix frontend ci` then `npm --prefix frontend run dev`. API and Socket.IO requests use Vite's proxy to port 5000.

The session is kept in memory; refreshing requires login again. Screen folders contain page UI; shared hooks manage reusable behavior; sharedServer modules call Axios; AP components provide reusable controls.
