# TalkToMe.AI  

## Introduction  
TalkToMe.AI is an AI-powered journaling mobile application built with **React Native**. The app provides users with a safe space to write down their daily thoughts, feelings, and reflections. Using integrated AI, the app analyzes the user’s journal entries to detect emotional tone and generate meaningful responses. This allows users not only to reflect on their own experiences but also to receive constructive feedback, mood insights, and personalized suggestions for self-growth.  

The project is designed to help people improve mental well-being, track their emotional journey, and gain clarity through intelligent journaling.  

---

## Features  
- Secure **user registration & login** with unique IDs  
- Create, edit, and store personal journal entries  
- AI-generated responses tailored to user’s journaling input  
- Automatic **mood detection** based on emotional tone of entries  
- Timestamped history of journal entries  
- User-friendly UI designed for accessibility and ease of use  
- Cloud-based storage with **Supabase** integration  
- Cross-platform availability (Android/iOS)  

---

## Technologies  
- **Frontend**: React Native  
- **Backend**: Supabase (database + authentication)  
- **AI Integration**: OpenAI API (ChatGPT for journaling responses & mood analysis)  
- **Database**: Supabase PostgreSQL  
- **Version Control**: GitHub  
- **Design**: Figma / Marvel (for prototyping and UI design)  

---

## Installation  

### Prerequisites  
- Node.js (v18 or higher)  
- npm or yarn  
- Expo CLI (for React Native development)  
- Supabase account + API keys  

### Steps  
1. Clone the repository:  
   ```bash
   git clone https://github.com/yourusername/talktome-ai.git
   cd talktome-ai
   ```
2. Install dependencies:  
   ```bash
   npm install
   ```
3. Configure environment variables:  
   - Create a `.env` file in the root directory  
   - Add your Supabase URL and API key, plus OpenAI API key:  
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     OPENAI_API_KEY=your_openai_key
     ```
4. Start the development server:  
   ```bash
   npx expo start
   ```
5. Run on device/emulator via Expo Go or simulator.  

---

## Development Setup  
For new developers joining the project:  
- Install **React Native & Expo CLI** globally  
- Ensure your Supabase database schema is migrated with the following tables:  

### Table 1: `user_info`  
| Column       | Type     | Description |  
|--------------|----------|-------------|  
| id           | int(8)   | Unique numeric user ID |  
| first_name   | text     | User’s first name |  
| last_name    | text     | User’s last name |  
| username     | text     | Unique username |  
| email        | text     | User’s email |  
| password     | text     | Hashed password |  
| created_at   | datetime | User account creation timestamp |  

### Table 2: `user_prmpt`  
| Column         | Type     | Description |  
|----------------|----------|-------------|  
| id             | int(8)   | Foreign key from `user_info.id` |  
| user_journal   | text     | User’s journal entry |  
| user_response  | text     | AI-generated response |  
| user_mood      | text     | AI-detected mood |  
| created_at     | datetime | Timestamp of entry |  

- Follow **GitHub branching strategy** (feature branches → pull request → main).  
- Run `npm run lint` before commits.  

---

## License  
This project is licensed under the **MIT License** – you’re free to use, modify, and distribute with attribution.  

---

## Contributors  
- **Valencia Ragins** – Frontend, UI/UX design  
- **Darin Thompson** – Backend, AI integration  
- **Siddharth Pathak** – Frontend, Database Integration  

---

## Project Status  
🚧 **Alpha Stage** – Basic features implemented (login, register, journaling).  
🔜 Next Milestone: Connect authentication and journaling storage with **Supabase**.  
