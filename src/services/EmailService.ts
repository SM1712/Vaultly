import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SimulatedEmail, EmailNotificationSettings } from '../types';
import {
  getTestEmailTemplate,
  getGoalMilestoneTemplate,
  getBudgetAlertTemplate,
  getProjectInvitationTemplate,
  getWeeklyBudgetControlTemplate
} from '../utils/emailTemplates';

// Storage key for simulated outbox
const SIMULATED_EMAILS_KEY = 'vaultly_simulated_emails';

// Custom Event to notify components when a simulated email is triggered
export const EMAIL_SENT_EVENT = 'vaultly_email_sent';

const getSimulatedEmails = (): SimulatedEmail[] => {
  try {
    const raw = localStorage.getItem(SIMULATED_EMAILS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading simulated emails", e);
    return [];
  }
};

const saveSimulatedEmail = (email: Omit<SimulatedEmail, 'id' | 'sentAt'>) => {
  try {
    const emails = getSimulatedEmails();
    const newEmail: SimulatedEmail = {
      ...email,
      id: crypto.randomUUID(),
      sentAt: new Date().toISOString()
    };
    emails.unshift(newEmail);
    // Keep last 50 emails
    localStorage.setItem(SIMULATED_EMAILS_KEY, JSON.stringify(emails.slice(0, 50)));
    
    // Dispatch custom event to notify UI listeners
    window.dispatchEvent(new CustomEvent(EMAIL_SENT_EVENT, { detail: newEmail }));
  } catch (e) {
    console.error("Error saving simulated email", e);
  }
};

export const EmailService = {
  getSimulatedEmails,
  
  clearHistory() {
    localStorage.removeItem(SIMULATED_EMAILS_KEY);
    window.dispatchEvent(new CustomEvent(EMAIL_SENT_EVENT));
  },

  async sendTestEmail(
    toEmail: string,
    userDisplayName: string,
    prefs?: EmailNotificationSettings
  ): Promise<boolean> {
    if (prefs && !prefs.enabled) {
      console.log("[EmailService] Global email notifications are disabled.");
      return false;
    }

    const theme = prefs?.theme || 'oscuro';
    const subject = "Prueba de Conexión - Vaultly";
    const bodyHtml = getTestEmailTemplate(userDisplayName, theme);

    // Save to local simulator
    saveSimulatedEmail({
      to: toEmail,
      subject,
      bodyHtml,
      status: 'sent',
      type: 'test'
    });

    // Write to Firestore (/mail)
    try {
      if (toEmail && toEmail !== 'Protegido') {
        await addDoc(collection(db, 'mail'), {
          to: toEmail,
          message: {
            subject,
            html: bodyHtml
          },
          createdAt: new Date().toISOString()
        });
        console.log("[EmailService] Test email written to Firestore /mail collection");
      }
      return true;
    } catch (error) {
      console.error("[EmailService] Error writing test email to Firestore:", error);
      return false;
    }
  },

  async sendGoalMilestoneEmail(
    toEmail: string,
    goalName: string,
    progressPercent: number,
    currentAmount: number,
    targetAmount: number,
    userDisplayName: string,
    prefs?: EmailNotificationSettings
  ): Promise<boolean> {
    // Preferences Guard
    if (prefs) {
      if (!prefs.enabled || !prefs.onGoalReached) {
        console.log("[EmailService] Milestone email skipped by user preferences.");
        return false;
      }
    }

    const theme = prefs?.theme || 'oscuro';
    const milestoneText = progressPercent >= 100 ? "Meta Completada" : `${progressPercent}% Completada`;
    const subject = `🌟 Hito de Meta de Ahorro: ${goalName} (${milestoneText})`;
    const bodyHtml = getGoalMilestoneTemplate(goalName, progressPercent, currentAmount, targetAmount, userDisplayName, theme);

    // Save to local simulator
    saveSimulatedEmail({
      to: toEmail,
      subject,
      bodyHtml,
      status: 'sent',
      type: 'goal_milestone'
    });

    // Write to Firestore (/mail)
    try {
      if (toEmail && toEmail !== 'Protegido') {
        await addDoc(collection(db, 'mail'), {
          to: toEmail,
          message: {
            subject,
            html: bodyHtml
          },
          createdAt: new Date().toISOString()
        });
        console.log(`[EmailService] Milestone ${progressPercent}% written to Firestore /mail`);
      }
      return true;
    } catch (error) {
      console.error("[EmailService] Error writing goal email to Firestore:", error);
      return false;
    }
  },

  async sendBudgetAlertEmail(
    toEmail: string,
    categoryName: string,
    spentAmount: number,
    limitAmount: number,
    userDisplayName: string,
    prefs?: EmailNotificationSettings
  ): Promise<boolean> {
    // Preferences Guard
    if (prefs) {
      if (!prefs.enabled || !prefs.onBudgetExceeded) {
        console.log("[EmailService] Budget alert email skipped by user preferences.");
        return false;
      }
    }

    const theme = prefs?.theme || 'oscuro';
    const subject = `⚠️ ALERTA: Presupuesto Excedido en "${categoryName}"`;
    const bodyHtml = getBudgetAlertTemplate(categoryName, spentAmount, limitAmount, userDisplayName, theme);

    // Save to local simulator
    saveSimulatedEmail({
      to: toEmail,
      subject,
      bodyHtml,
      status: 'sent',
      type: 'budget_warning'
    });

    // Write to Firestore (/mail)
    try {
      if (toEmail && toEmail !== 'Protegido') {
        await addDoc(collection(db, 'mail'), {
          to: toEmail,
          message: {
            subject,
            html: bodyHtml
          },
          createdAt: new Date().toISOString()
        });
        console.log(`[EmailService] Budget warning written to Firestore /mail`);
      }
      return true;
    } catch (error) {
      console.error("[EmailService] Error writing budget warning to Firestore:", error);
      return false;
    }
  },

  async sendWeeklyBudgetControlEmail(
    toEmail: string,
    userDisplayName: string,
    currency: string,
    categoriesData: Array<{ name: string; spent: number; limit: number; percent: number }>,
    globalLimit: { enabled: boolean; amount: number; spent: number; percent: number },
    prefs?: EmailNotificationSettings
  ): Promise<boolean> {
    if (prefs) {
      if (!prefs.enabled || !prefs.onWeeklyBudgetControl) {
        console.log("[EmailService] Weekly budget control email skipped by user preferences.");
        return false;
      }
    }

    const theme = prefs?.theme || 'oscuro';
    const subject = "📊 Reporte de Control Semanal de Presupuestos";
    const bodyHtml = getWeeklyBudgetControlTemplate(userDisplayName, currency, categoriesData, globalLimit, theme);

    // Save to local simulator
    saveSimulatedEmail({
      to: toEmail,
      subject,
      bodyHtml,
      status: 'sent',
      type: 'weekly_budget_control'
    });

    // Write to Firestore (/mail)
    try {
      if (toEmail && toEmail !== 'Protegido') {
        await addDoc(collection(db, 'mail'), {
          to: toEmail,
          message: {
            subject,
            html: bodyHtml
          },
          createdAt: new Date().toISOString()
        });
        console.log("[EmailService] Weekly budget control email written to Firestore /mail");
      }
      return true;
    } catch (error) {
      console.error("[EmailService] Error writing weekly budget email to Firestore:", error);
      return false;
    }
  },

  async sendProjectInvitationEmail(
    toNickname: string,
    toUid: string | undefined,
    projectName: string,
    inviterNickname: string,
    toEmail: string | undefined,
    prefs?: EmailNotificationSettings
  ): Promise<boolean> {
    if (prefs && !prefs.enabled) {
      console.log("[EmailService] Project invitation email skipped.");
      return false;
    }

    const theme = prefs?.theme || 'oscuro';
    const subject = `👥 Invitación de Proyecto: @${inviterNickname} te invitó a unirte a "${projectName}"`;
    const recipientEmail = (toEmail && toEmail !== 'Protegido') ? toEmail : `@${toNickname}@vaultly-user.com`;
    const userDisplayName = toNickname;
    const bodyHtml = getProjectInvitationTemplate(projectName, inviterNickname, userDisplayName, theme);

    // Save to local simulator
    saveSimulatedEmail({
      to: recipientEmail,
      subject,
      bodyHtml,
      status: toEmail && toEmail !== 'Protegido' ? 'sent' : 'queued',
      type: 'project_invitation'
    });

    // Write to Firestore
    try {
      if (toEmail && toEmail !== 'Protegido') {
        await addDoc(collection(db, 'mail'), {
          to: toEmail,
          message: {
            subject,
            html: bodyHtml
          },
          createdAt: new Date().toISOString()
        });
        console.log(`[EmailService] Project invitation email written to Firestore /mail`);
      } else {
        await addDoc(collection(db, 'mail_queue'), {
          toUid: toUid || null,
          toNickname: toNickname,
          fromNickname: inviterNickname,
          projectName: projectName,
          subject,
          createdAt: new Date().toISOString(),
          status: 'pending'
        });
        console.log(`[EmailService] Project invitation email queued in Firestore /mail_queue`);
      }
      return true;
    } catch (error) {
      console.error("[EmailService] Error queueing/writing project invitation email:", error);
      return false;
    }
  }
};
