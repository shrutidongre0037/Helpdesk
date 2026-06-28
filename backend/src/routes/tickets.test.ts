import { describe, it, expect, mock, beforeEach, afterEach, jest } from 'bun:test';
import express from 'express';
import request from 'supertest';
import ticketsRouter from './tickets';

// Mock dependencies
const mockPrisma = {
  ticket: {
    findUnique: mock(),
    update: mock(),
    findMany: mock(),
    count: mock(),
  },
  ticketReply: {
    create: mock(),
  },
  user: {
    findUnique: mock(),
  },
  $transaction: mock(),
};

mock.module('../db', () => ({
  default: mockPrisma
}));

let mockUser: any = { role: 'ADMIN', id: 'admin1' };

mock.module('../auth', () => ({
  auth: {
    api: {
      getSession: mock().mockImplementation(async () => {
        if (!mockUser) return null;
        return { user: mockUser, session: {} };
      })
    }
  }
}));

describe('Tickets API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tickets', ticketsRouter);
    
    // Reset mocks
    mockPrisma.ticket.findUnique.mockReset();
    mockPrisma.ticket.update.mockReset();
    mockPrisma.ticketReply.create.mockReset();
    mockPrisma.user.findUnique.mockReset();
    
    // Default user to admin for assignment tests
    mockUser = { role: 'ADMIN', id: 'admin1' };
  });

  describe('PATCH /api/tickets/:id', () => {
    it('should return 403 if user is not an ADMIN', async () => {
      mockUser = { role: 'AGENT', id: 'agent1' };
      
      const response = await request(app)
        .patch('/api/tickets/1')
        .send({ assignedToId: 'agent2' });
        
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should return 400 if ticket ID is not a valid number', async () => {
      const response = await request(app)
        .patch('/api/tickets/abc')
        .send({ assignedToId: 'agent2' });
        
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid ticket ID');
    });

    it('should return 400 if assignedToId is provided but user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      
      const response = await request(app)
        .patch('/api/tickets/1')
        .send({ assignedToId: 'non-existent-user' });
        
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid or inactive user specified');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-user' }
      });
      expect(mockPrisma.ticket.update).not.toHaveBeenCalled();
    });

    it('should return 400 if assignedToId is provided but user is soft-deleted', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ 
        id: 'deleted-user', 
        deletedAt: new Date() 
      });
      
      const response = await request(app)
        .patch('/api/tickets/1')
        .send({ assignedToId: 'deleted-user' });
        
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid or inactive user specified');
      expect(mockPrisma.ticket.update).not.toHaveBeenCalled();
    });

    it('should update the ticket when assignedToId is a valid user', async () => {
      const validUser = { id: 'valid-agent', name: 'Agent', deletedAt: null };
      const updatedTicket = { id: 1, assignedToId: 'valid-agent' };
      
      mockPrisma.user.findUnique.mockResolvedValueOnce(validUser);
      mockPrisma.ticket.update.mockResolvedValueOnce(updatedTicket);
      
      const response = await request(app)
        .patch('/api/tickets/1')
        .send({ assignedToId: 'valid-agent' });
        
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedTicket);
      expect(mockPrisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { assignedToId: 'valid-agent' },
        include: { assignedTo: { select: { id: true, name: true } } }
      });
    });

    it('should update the ticket when assignedToId is explicitly null (unassigning)', async () => {
      const updatedTicket = { id: 1, assignedToId: null };
      
      mockPrisma.ticket.update.mockResolvedValueOnce(updatedTicket);
      
      const response = await request(app)
        .patch('/api/tickets/1')
        .send({ assignedToId: null });
        
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedTicket);
      
      // Should skip user validation if assignedToId is null
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      
      expect(mockPrisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { assignedToId: null },
        include: { assignedTo: { select: { id: true, name: true } } }
      });
    });

    it('should not update assignedToId if not provided in payload', async () => {
      const updatedTicket = { id: 1, assignedToId: null };
      mockPrisma.ticket.update.mockResolvedValueOnce(updatedTicket);
      
      const response = await request(app)
        .patch('/api/tickets/1')
        .send({}); // Empty payload
        
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No fields to update');
    });

    it('should return 400 if an invalid status is provided', async () => {
      const response = await request(app)
        .patch('/api/tickets/1')
        .send({ status: 'INVALID_STATUS' });
        
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid ticket status');
      expect(mockPrisma.ticket.update).not.toHaveBeenCalled();
    });

    it('should update the ticket status if a valid status is provided', async () => {
      const updatedTicket = { id: 1, status: 'OPEN' };
      mockPrisma.ticket.update.mockResolvedValueOnce(updatedTicket);
      
      const response = await request(app)
        .patch('/api/tickets/1')
        .send({ status: 'OPEN' });
        
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedTicket);
      
      expect(mockPrisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'OPEN' },
        include: { assignedTo: { select: { id: true, name: true } } }
      });
    });
  });

  describe('POST /api/tickets/:id/replies', () => {
    it('should return 400 if ticket ID is invalid', async () => {
      const response = await request(app)
        .post('/api/tickets/abc/replies')
        .send({ body: 'Hello' });
        
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid ticket ID');
    });

    it('should return 400 if reply body is missing or empty', async () => {
      const response = await request(app)
        .post('/api/tickets/1/replies')
        .send({ body: '   ' });
        
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Reply body is required');
    });

    it('should return 404 if ticket does not exist', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValueOnce(null);
      
      const response = await request(app)
        .post('/api/tickets/1/replies')
        .send({ body: 'Hello' });
        
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Ticket not found');
      expect(mockPrisma.ticket.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should create a reply and return 201', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValueOnce({ id: 1 });
      const newReply = { id: 10, body: 'Hello', ticketId: 1, sentType: 'AGENT', authorId: 'admin1' };
      mockPrisma.ticketReply.create.mockResolvedValueOnce(newReply);
      
      const response = await request(app)
        .post('/api/tickets/1/replies')
        .send({ body: 'Hello' });
        
      expect(response.status).toBe(201);
      expect(response.body).toEqual(newReply);
      expect(mockPrisma.ticketReply.create).toHaveBeenCalledWith({
        data: {
          body: 'Hello',
          ticketId: 1,
          authorId: 'admin1',
          sentType: 'AGENT'
        },
        include: {
          author: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    });

    it('should create a customer reply if sentType is CUSTOMER', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValueOnce({ id: 1 });
      const newReply = { id: 11, body: 'Thanks', ticketId: 1, sentType: 'CUSTOMER', authorId: 'admin1' };
      mockPrisma.ticketReply.create.mockResolvedValueOnce(newReply);
      
      const response = await request(app)
        .post('/api/tickets/1/replies')
        .send({ body: 'Thanks', sentType: 'CUSTOMER' });
        
      expect(response.status).toBe(201);
      expect(response.body).toEqual(newReply);
      expect(mockPrisma.ticketReply.create).toHaveBeenCalledWith({
        data: {
          body: 'Thanks',
          ticketId: 1,
          authorId: 'admin1',
          sentType: 'CUSTOMER'
        },
        include: {
          author: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    });
  });
});
