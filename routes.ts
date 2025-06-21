import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";

export async function registerRoutes(app: Express): Promise<Server> {
  // News API proxy routes
  app.get("/api/news/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { page = "1", pageSize = "12", q } = req.query;
      
      const NEWS_API_KEY = process.env.NEWS_API_KEY || process.env.VITE_NEWS_API_KEY || "your_api_key_here";
      const NEWS_API_BASE_URL = "https://newsapi.org/v2";
      
      let url;
      
      if (q) {
        // Search query
        url = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(q as string)}&pageSize=${pageSize}&page=${page}&sortBy=relevancy&apiKey=${NEWS_API_KEY}`;
      } else if (category === 'search' && q) {
        // Handle search endpoint
        url = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(q as string)}&pageSize=${pageSize}&page=${page}&sortBy=relevancy&apiKey=${NEWS_API_KEY}`;
      } else if (category === 'trending') {
        url = `${NEWS_API_BASE_URL}/top-headlines?country=us&pageSize=${pageSize}&page=${page}&apiKey=${NEWS_API_KEY}`;
      } else if (category === 'world') {
        url = `${NEWS_API_BASE_URL}/top-headlines?category=general&pageSize=${pageSize}&page=${page}&apiKey=${NEWS_API_KEY}`;
      } else {
        url = `${NEWS_API_BASE_URL}/top-headlines?category=${category}&country=us&pageSize=${pageSize}&page=${page}&apiKey=${NEWS_API_KEY}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'ok') {
        // Filter out removed articles
        const filteredArticles = data.articles.filter((article: any) => 
          article.title && 
          article.description && 
          article.title !== '[Removed]' &&
          article.description !== '[Removed]'
        );
        
        res.json({
          ...data,
          articles: filteredArticles
        });
      } else {
        res.status(400).json({ message: data.message || 'Failed to fetch news' });
      }
    } catch (error) {
      console.error('News API error:', error);
      res.status(500).json({ message: 'Failed to fetch news articles' });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactMessageSchema.parse(req.body);
      
      // Store in memory
      const message = await storage.createContactMessage(validatedData);
      
      // Send email notification
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com',
            pass: process.env.EMAIL_PASS || 'your-app-password'
          }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER || 'your-email@gmail.com',
          to: 'mdchild21@gmail.com',
          subject: `Contact from ${validatedData.name} - Classic Times`,
          html: `
            <h3>New Contact Message</h3>
            <p><strong>Name:</strong> ${validatedData.name}</p>
            <p><strong>Email:</strong> ${validatedData.email}</p>
            <p><strong>Message:</strong></p>
            <p>${validatedData.message}</p>
          `
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue even if email fails
      }
      
      res.json({ message: 'Contact message sent successfully', data: message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid contact form data', errors: error.errors });
      } else {
        console.error('Contact form error:', error);
        res.status(500).json({ message: 'Failed to send contact message' });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
