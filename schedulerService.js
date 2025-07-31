// schedulerService.js - MongoDB Version
const cron = require('node-cron');
const { ObjectId } = require('mongodb');

class SchedulerService {
    constructor(db) {
        this.db = db;
        this.collection = db.collection('scheduled_messages');
        this.scheduledJobs = new Map();
        this.initializeSchedulerService();
    }

    // Initialize the scheduler service
    async initializeSchedulerService() {
        try {
            // Create indexes for better performance
            await this.collection.createIndex({ scheduled_datetime: 1 });
            await this.collection.createIndex({ status: 1 });
            await this.collection.createIndex({ job_id: 1 }, { unique: true });
            
            console.log('✅ Scheduled messages collection initialized');
            
            // Restore pending jobs after server restart
            await this.restorePendingJobs();
        } catch (error) {
            console.error('Error initializing scheduler service:', error);
        }
    }

    // Schedule a message
    async scheduleMessage(message, day, time) {
        try {
            // Parse and validate date and time
            const scheduledDate = new Date(day);
            const [hours, minutes] = time.split(':');
            
            if (isNaN(scheduledDate.getTime())) {
                throw new Error('Invalid date format. Use YYYY-MM-DD');
            }

            if (!hours || !minutes || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                throw new Error('Invalid time format. Use HH:MM (24-hour format)');
            }

            // Create full datetime
            const scheduledDateTime = new Date(scheduledDate);
            scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Check if the scheduled time is in the future
            if (scheduledDateTime <= new Date()) {
                throw new Error('Scheduled time must be in the future');
            }

            // Generate job ID
            const jobId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Create document
            const messageDoc = {
                message: message,
                scheduled_date: scheduledDate.toISOString().split('T')[0],
                scheduled_time: time,
                scheduled_datetime: scheduledDateTime,
                status: 'pending',
                created_at: new Date(),
                executed_at: null,
                job_id: jobId
            };

            // Insert into MongoDB
            const result = await this.collection.insertOne(messageDoc);

            // Schedule the cron job
            this.createCronJob(result.insertedId, scheduledDateTime, message, jobId);

            return {
                success: true,
                messageId: result.insertedId,
                scheduledFor: scheduledDateTime.toISOString(),
                jobId: jobId,
                message: 'Message scheduled successfully'
            };

        } catch (error) {
            console.error('Error scheduling message:', error);
            throw error;
        }
    }

    // Create a cron job
    createCronJob(messageId, scheduledDateTime, message, jobId) {
        // Convert datetime to cron format
        const cronExpression = this.dateToCron(scheduledDateTime);
        
        console.log(`📅 Scheduling message ID ${messageId} with cron: ${cronExpression}`);

        const task = cron.schedule(cronExpression, async () => {
            try {
                console.log(`🚀 Executing scheduled message: ${message}`);
                
                // Update status to executed
                await this.collection.updateOne(
                    { _id: messageId },
                    { 
                        $set: { 
                            status: 'executed', 
                            executed_at: new Date() 
                        } 
                    }
                );

                // Process the message
                await this.processMessage(message, messageId);

                // Remove from scheduled jobs
                this.scheduledJobs.delete(jobId);
                
                // Destroy the cron job
                task.destroy();
                
                console.log(`✅ Message ID ${messageId} executed successfully`);
            } catch (error) {
                console.error(`Error executing message ID ${messageId}:`, error);
                
                // Update status to failed
                await this.collection.updateOne(
                    { _id: messageId },
                    { $set: { status: 'failed' } }
                );
            }
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });

        // Store the job reference
        this.scheduledJobs.set(jobId, {
            task,
            messageId,
            scheduledDateTime,
            message
        });
    }

    // Convert date to cron expression
    dateToCron(date) {
        const minute = date.getMinutes();
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        
        return `${minute} ${hour} ${day} ${month} *`;
    }

    // Process the message (customize this for your insurance system)
    async processMessage(message, messageId) {
        console.log(`Processing insurance message: "${message}"`);
        
        // You can customize this to:
        // - Send policy renewal reminders
        // - Update policy statuses
        // - Send notifications to agents/users
        // - Generate reports
        // - Make API calls to external systems
        
        console.log(`Insurance message processed at ${new Date().toISOString()}`);
    }

    // Restore pending jobs after server restart
    async restorePendingJobs() {
        try {
            const pendingMessages = await this.collection.find({
                status: 'pending',
                scheduled_datetime: { $gt: new Date() }
            }).sort({ scheduled_datetime: 1 }).toArray();

            console.log(`🔄 Restoring ${pendingMessages.length} pending scheduled messages`);

            for (const msg of pendingMessages) {
                this.createCronJob(msg._id, new Date(msg.scheduled_datetime), msg.message, msg.job_id);
            }

            // Mark expired messages as expired
            await this.collection.updateMany(
                {
                    status: 'pending',
                    scheduled_datetime: { $lte: new Date() }
                },
                { $set: { status: 'expired' } }
            );

        } catch (error) {
            console.error('Error restoring pending jobs:', error);
        }
    }

    // Get all scheduled messages
    async getScheduledMessages(status = null) {
        try {
            let query = {};
            
            if (status) {
                query.status = status;
            }

            const messages = await this.collection.find(query)
                .sort({ scheduled_datetime: 1 })
                .toArray();
                
            return messages;
        } catch (error) {
            console.error('Error fetching scheduled messages:', error);
            throw error;
        }
    }

    // Cancel a scheduled message
    async cancelScheduledMessage(messageId) {
        try {
            // Convert string to ObjectId if needed
            const id = typeof messageId === 'string' ? new ObjectId(messageId) : messageId;
            
            // Find the message
            const message = await this.collection.findOne({ 
                _id: id, 
                status: 'pending' 
            });

            if (!message) {
                throw new Error('Message not found or already processed');
            }

            // Cancel the cron job
            const jobData = this.scheduledJobs.get(message.job_id);
            if (jobData) {
                jobData.task.destroy();
                this.scheduledJobs.delete(message.job_id);
            }

            // Update status to cancelled
            await this.collection.updateOne(
                { _id: id },
                { $set: { status: 'cancelled' } }
            );

            return { success: true, message: 'Scheduled message cancelled' };
        } catch (error) {
            console.error('Error cancelling scheduled message:', error);
            throw error;
        }
    }

    // Get scheduler statistics
    async getSchedulerStats() {
        try {
            const stats = await this.collection.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        pending: { 
                            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } 
                        },
                        executed: { 
                            $sum: { $cond: [{ $eq: ["$status", "executed"] }, 1, 0] } 
                        },
                        failed: { 
                            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } 
                        },
                        cancelled: { 
                            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } 
                        },
                        expired: { 
                            $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } 
                        }
                    }
                }
            ]).toArray();

            const result = stats[0] || {
                total: 0, pending: 0, executed: 0, 
                failed: 0, cancelled: 0, expired: 0
            };

            return {
                ...result,
                activeJobs: this.scheduledJobs.size
            };
        } catch (error) {
            console.error('Error fetching scheduler stats:', error);
            throw error;
        }
    }
}

module.exports = SchedulerService;