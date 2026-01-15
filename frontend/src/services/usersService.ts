import api from './api';
import type { User, UserCreate, UserUpdate, Role } from '@/types/auth';

export interface UserFilters {
  is_active?: boolean;
  search?: string;
  role_id?: string;
}

/**
 * Users service - CRUD operations for organization users
 * These endpoints are for organization owners/managers to manage their team
 */
export const usersService = {
  /**
   * Get all users in the organization
   */
  async getUsers(filters?: UserFilters): Promise<User[]> {
    const response = await api.get<User[]>('/users/', { params: filters });
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Create new user in organization
   */
  async createUser(data: UserCreate): Promise<User> {
    const response = await api.post<User>('/users/', data);
    return response.data;
  },

  /**
   * Update user
   */
  async updateUser(id: string, data: UserUpdate): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  /**
   * Reset user password (admin action)
   */
  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    await api.post(`/users/${id}/reset-password`, { new_password: newPassword });
  },

  /**
   * Get available roles for the organization
   */
  async getRoles(): Promise<Role[]> {
    const response = await api.get<Role[]>('/roles/');
    return response.data;
  },

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string): Promise<void> {
    await api.post(`/users/${userId}/roles`, { role_id: roleId });
  },

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string): Promise<void> {
    await api.delete(`/users/${userId}/roles/${roleId}`);
  },
};

export default usersService;
