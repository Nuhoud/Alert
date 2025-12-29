import { Injectable } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EmailService } from '../emails/email.service'
import { FcmService } from '../firebase/firebase.service';

/* 
        jobOfferId,
        userId,
        title,
        employerEmail,
        userSnap,

        const userSnap = {
            name: user.name,
            ...(user.email && { email: user.email }), 
            ...(user.mobile && { mobile: user.mobile }),
            ...(user.basic && { basic: user.basic }),
            education: user.education || [],
            experiences: user.experiences || [],
            certifications: user.certifications || [],
            ...(user.skills && { skills: user.skills }),
            ...(user.jobPreferences && { jobPreferences: user.jobPreferences }),
            ...(user.goals && { goals: user.goals })
        };
*/

@Injectable()
export class ApplicationService {
    constructor(
        private emailService: EmailService,
        private whatsappService: WhatsappService,
        private fcmService: FcmService
    ) {}


    async sumbitApplicationNotifications(message: any) {
        await Promise.all([
          this.sendApplicationToEmployer(message),
          this.sendApplicationToUser(message),
        ]);
    }
      
    async sendApplicationToEmployer(message: any) {
      const { employerEmail, employerId, jobTitle, userSnap, companyName, jobOfferId } = message;
    
      const appName = 'Nuhoud';
      const positionTitle = jobTitle || 'your job';
    
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">${appName} ƒ?? New Job Application</h2>
          
          <p style="color: #555; font-size: 16px;">You have received a new application for the job: <b>${positionTitle}</b>${companyName ? ` at <b>${companyName}</b>` : ''}.</p>
    
          <h3 style="color: #444; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Applicant Info</h3>
    
          <table style="width: 100%; font-size: 14px; color: #555; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">${userSnap.name}</td></tr>
            ${userSnap.email ? `<tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${userSnap.email}</td></tr>` : ''}
            ${userSnap.mobile ? `<tr><td style="padding: 8px; font-weight: bold;">Mobile:</td><td style="padding: 8px;">${userSnap.mobile}</td></tr>` : ''}
            ${userSnap.basic?.nationality ? `<tr><td style="padding: 8px; font-weight: bold;">Nationality:</td><td style="padding: 8px;">${userSnap.basic.nationality}</td></tr>` : ''}
            ${userSnap.basic?.birthDate ? `<tr><td style="padding: 8px; font-weight: bold;">Birth Date:</td><td style="padding: 8px;">${userSnap.basic.birthDate}</td></tr>` : ''}
          </table>
    
          ${userSnap.skills?.length ? `
            <h4 style="margin-top: 20px; color: #444;">Skills</h4>
            <p style="color: #555;">${userSnap.skills.join(', ')}</p>` : ''}
    
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
            &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
        </div>
      `;

      if (employerEmail) {
        await this.emailService.SendMail({
          to: employerEmail,
          subject: `${appName} ƒ?? New Application for "${positionTitle}"`,
          html,
        });
        console.log(`[ApplicationService] Sent email to employer ${employerEmail} for new application.`);
      }

      if (employerId) {
        await this.fcmService.sendToUser(String(employerId), {
          title: 'New job application',
          body: `${userSnap?.name || 'A candidate'} applied for "${positionTitle}"${companyName ? ` at ${companyName}` : ''}.`,
          data: {
            screen: '/employer/applications/' + jobOfferId,
          },
        });
        console.log(`[ApplicationService] Sent FCM notification to employer ${employerId} for new application.`);
      }
    }

    async sendApplicationToUser(message: any) {
      const { userSnap, jobTitle, companyName, userId, jobOfferId } = message;
      const appName = 'Nuhoud';
      const promises: Promise<any>[] = [];
      const positionTitle = jobTitle || 'the job';
    
      // Email to User
      if (userSnap.email) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">${appName} â€“ Application Confirmation</h2>
            
            <p style="color: #555; font-size: 16px;">You have successfully applied to the job: <b>${positionTitle}</b>${companyName ? ` at <b>${companyName}</b>` : ''}.</p>
    
            <p style="color: #555; font-size: 14px;">We will notify you once the employer takes action on your application.</p>
    
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
              &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
            </p>
          </div>
        `;
    
        promises.push(this.emailService.SendMail({
          to: userSnap.email,
          subject: `${appName} â€“ Application Submitted`,
          html,
        }));
        console.log(`[ApplicationService] Queued email to user ${userSnap.email} for application confirmation.`);
      }
    
      // WhatsApp to User
      if (userSnap.mobile) {
        const messageText = `âœ… You successfully applied for "${positionTitle}"${companyName ? ` at ${companyName}` : ''}.`;
        promises.push(this.whatsappService.sendMessage({
          mobileNumber: userSnap.mobile,
          message: messageText,
        }));
        console.log(`[ApplicationService] Queued WhatsApp message to user ${userSnap.mobile} for application confirmation.`);
      }
    
      if (userId) {
        promises.push(this.fcmService.sendToUser(String(userId), {
          title: 'Application submitted',
          body: `You successfully applied for "${positionTitle}"${companyName ? ` at ${companyName}` : ''}.`,
          data: {
            screen: '/job-application-details/' + jobOfferId,
          },
        }));
        console.log(`[ApplicationService] Queued FCM notification to user ${userId} for application confirmation.`);
      }

      if (!userSnap.email && !userSnap.mobile) {
        console.warn(`[AlertService] User ${message.userId} has no contact method`);
      }
    
      await Promise.all(promises);
    }

    async sendApplicationStatusToUser(message: any) {
      const appName = 'Nuhoud';
    
      //console.log("message",message);

      const { 
        status, 
        employerNote, 
        companyName, 
        jobTitle, 
        userSnap,
        userId,
        jobOfferId
      } = message;

      console.log("status",status);

      const promises: Promise<any>[] = [];
    
      // Email Notification
      if (userSnap.email) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">${appName} â€“ Application Status Update</h2>
    
            <p style="color: #555; font-size: 16px;">The status of your application for the job <b>"${jobTitle}"</b>${companyName ? ` at <b>${companyName}</b>` : ''} has been updated.</p>
    
            <p style="color: #444; font-size: 16px;"><b>New Status:</b> ${status}</p>
    
            ${employerNote ? `<p style="color: #555; font-size: 14px;"><b>Note from Employer:</b> ${employerNote}</p>` : ''}
    
            <p style="color: #555; font-size: 14px;">Please check your account for more details.</p>
    
            <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
              &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
            </div>
          </div>
        `;
    
        promises.push(this.emailService.SendMail({
          to: userSnap.email,
          subject: `${appName} â€“ Your Application Status for "${jobTitle}" Has Changed`,
          html,
        }));

        console.log(`[ApplicationService] Queued email to user ${userSnap.email} for application status update.`);
      }
    
      // WhatsApp Notification
      if (userSnap.mobile) {
        const msg = `ًں“¢ Update on your application:\n\nPosition: ${jobTitle}\nCompany: ${companyName ?? 'N/A'}\nNew Status: ${status}${employerNote ? `\nNote: ${employerNote}` : ''}`;
    
        promises.push(this.whatsappService.sendMessage({
          mobileNumber: userSnap.mobile,
          message: msg,
        }));

        console.log(`[ApplicationService] Queued WhatsApp message to user ${userSnap.mobile} for application status update.`);
      }
    
      if (userId) {
        promises.push(this.fcmService.sendToUser(String(userId), {
          title: 'Application status update',
          body: `Your application for "${jobTitle}" is now "${status}".${employerNote ? ` Note: ${employerNote}` : ''}`,
          data: {
            screen: '/job-application-details/' + jobOfferId,
          },
        }));

        console.log(`[ApplicationService] Queued FCM notification to user ${userId} for application status update.`);
      }

      if (!userSnap.email && !userSnap.mobile) {
        console.warn(`[AlertService] Cannot notify user (missing email/mobile) for application status update.`);
      }
    
      await Promise.all(promises);
    }

    async sendApplicationNotCreatedNotification(message: any) {
      const { userId, reason, jobOfferId, jobTitle, companyName } = message;

      if (!userId) {
        console.warn('[AlertService] Missing userId for application not created event.');
        return;
      }

      const reasonText = reason || 'Your application could not be submitted.';
      const title = 'Application not submitted';
      const body = jobTitle
        ? `Your application for "${jobTitle}"${companyName ? ` at ${companyName}` : ''} could not be submitted. ${reasonText}`
        : `Your application could not be submitted. ${reasonText}`;

      await this.fcmService.sendToUser(userId, {
        title,
        body,
        data: {
          screen: '/job-details/' + jobOfferId,
        },
      });
    }
    
}




