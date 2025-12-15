import { User } from '../types';

const USERS_KEY = 'wf_users';
const CURRENT_USER_KEY = 'wf_current_user_id';

const getUsers = (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
};

export const registerUser = (username: string, password: string): User => {
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        throw new Error("Username already exists");
    }
    
    // Simple mock ID and "hash" (do not use in production)
    const newUser: User = {
        id: crypto.randomUUID(),
        username,
        passwordHash: btoa(password) 
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
};

export const loginUser = (username: string, password: string): User => {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.passwordHash === btoa(password));
    if (!user) {
        throw new Error("Invalid credentials");
    }
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    return user;
};

export const logoutUser = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;
    const users = getUsers();
    return users.find(u => u.id === userId) || null;
};
