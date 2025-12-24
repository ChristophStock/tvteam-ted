A client-server application for live polling on stage shows. Participants answer custom questions on their devices, and results are displayed centrally.

## Configuration & Deployment

### 1. Password Protection for Control Page

The admin Control Page is protected by a password. You can configure the password in two ways:

- **Via `.env` file** (recommended for local/dev):

  - Place a `.env` file in the project root or mount it into the backend container.
  - Example:
    ```env
    CONTROL_PASSWORD=yourSecretPassword
    ```

- **Via Docker Compose environment variable** (overrides `.env`):
  - In `docker-compose.yml` under the `backend` service:
    ```yaml
    services:
    	backend:
    		environment:
    			- CONTROL_PASSWORD=yourSecretPassword
    ```

### 2. Allowed Hosts for Frontend

To restrict which hosts can access the frontend (Vite preview), set allowed hosts:

- **Via `.env` file**:
  ```env
  ALLOWED_HOSTS=localhost,example.com
  ```
- **Or via Docker Compose**:
  ```yaml
  services:
  	frontend:
  		environment:
  			- ALLOWED_HOSTS=localhost,example.com
  ```

### 3. Exposed Port & Nginx Reverse Proxy

All external access (API, frontend, websockets) is routed through the Nginx reverse proxy. Only the Nginx port is exposed to the outside:

- By default, Nginx listens on port `8080` (see `docker-compose.yml`).
- Access the app via: `http://<your-server>:8080/`
- All API requests and websocket connections are automatically proxied to the correct backend service.

**Do not expose backend or frontend ports directly. Always use the Nginx port for external access.**

### 4. Changing Configuration at Runtime

    ```sh
    docker compose restart backend frontend nginx
    ```

## Usage Instructions

### Control Page (Admin)

The Control Page is used by the show admin to manage the voting process and view live results.

**How to use:**

1. Open `http://<your-server>:8080/control` in your browser.
2. Log in with the password set in your `.env` or `docker-compose.yml` (`CONTROL_PASSWORD`).
3. You can:
   - See a list of all questions and their current status (active/closed).
   - Activate a question to start a new voting round.
   - Close a question to end voting for that round.
   - View live results for each question, including the number of votes per option.
   - Trigger the display of results and emoji animations on the Result Page.

### Result Page (Display)

The Result Page is intended for projection or display to the audience.

**How to use:**

1. Open `http://<your-server>:8080/result` in a browser or on a projector.
2. The page will automatically update to show the current question, live results, and any triggered emoji/balloon animations.
3. Animations and result displays are controlled by the admin via the Control Page.

### Vote Page (Participants)

The Vote Page is used by participants to submit their answers.

**How to use:**

1. Open `http://<your-server>:8080/` (or `/vote`) on a mobile device or browser.
2. When a question is active, participants can select an option and submit their vote.
3. After voting, participants may see a waiting screen or feedback, depending on the current round state.
4. The Vote Page will update automatically as new questions become active.
