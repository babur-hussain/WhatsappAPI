// ══════════════════════════════════════════════════════════════════════════════
// Meta WhatsApp Template Library — All 170 templates (151 Utility + 19 Auth)
// Auto-generated from Meta's Template Library structure
// ══════════════════════════════════════════════════════════════════════════════

export interface MetaTemplate {
    id: string;
    name: string;
    category: string;
    language: string;
    status: string;
    components: any[];
    quality_score?: any;
    rejected_reason?: string;
    isDefault: boolean;
    group: string;
}

export const TEMPLATE_GROUPS: { name: string; category: string; count: number }[] = [
    { name: "Account or product protection", category: "UTILITY", count: 10 },
    { name: "Account updates", category: "UTILITY", count: 15 },
    { name: "Call permissions", category: "UTILITY", count: 5 },
    { name: "Customer feedback", category: "UTILITY", count: 8 },
    { name: "Event reminder", category: "UTILITY", count: 11 },
    { name: "Group invitation link", category: "UTILITY", count: 4 },
    { name: "Legal / regulatory compliance", category: "UTILITY", count: 8 },
    { name: "Order management", category: "UTILITY", count: 18 },
    { name: "Payment", category: "UTILITY", count: 15 },
    { name: "Shipping / Delivery", category: "UTILITY", count: 10 },
    { name: "Messaging limits", category: "UTILITY", count: 3 },
    { name: "Catalogue", category: "UTILITY", count: 6 },
    { name: "Reservation", category: "UTILITY", count: 6 },
    { name: "Ticket / Pass", category: "UTILITY", count: 6 },
    { name: "Subscription", category: "UTILITY", count: 9 },
    { name: "General Utility", category: "UTILITY", count: 17 },
    { name: "OTP / Verification", category: "AUTHENTICATION", count: 19 },
];

export const META_DEFAULT_TEMPLATES: MetaTemplate[] = [
    {
        "id": "default_fraud_alert_1",
        "name": "fraud_alert_1",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account or product protection",
        "components": [
            {
                "type": "BODY",
                "text": "⚠️ Hi {{1}}, we detected unusual activity on your account. If this wasn't you, please secure your account immediately."
            },
            {
                "type": "FOOTER",
                "text": "Your security is our priority"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Secure Account",
                        "url": "https://example.com/secure"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_fraud_alert_2",
        "name": "fraud_alert_2",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account or product protection",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, a login attempt was made from a new device on {{2}}. If this was you, no action is needed. Otherwise, please change your password."
            },
            {
                "type": "FOOTER",
                "text": "Security Alert"
            }
        ]
    },
    {
        "id": "default_fraud_alert_3",
        "name": "fraud_alert_3",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account or product protection",
        "components": [
            {
                "type": "BODY",
                "text": "🔒 Important: Your account password was changed on {{1}}. If you didn't make this change, contact support immediately."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Contact Support",
                        "url": "https://example.com/support"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_suspicious_activity_alert",
        "name": "suspicious_activity_alert",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account or product protection",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, we noticed suspicious activity on your account from {{2}}. Your account has been temporarily restricted for your protection."
            },
            {
                "type": "FOOTER",
                "text": "Account Protection"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Review Activity",
                        "url": "https://example.com/activity"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_account_lock_notification",
        "name": "account_lock_notification",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account or product protection",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your account has been locked due to multiple failed login attempts. Please verify your identity to unlock."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Unlock Account",
                        "url": "https://example.com/unlock"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_account_unlock_confirmation",
        "name": "account_unlock_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account or product protection",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your account has been successfully unlocked. You can now log in normally. If you didn't request this, please contact us."
            },
            {
                "type": "FOOTER",
                "text": "Security Notice"
            }
        ]
    },
    {
        "id": "default_security_code_alert",
        "name": "security_code_alert",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account or product protection",
        "components": [
            {
                "type": "BODY",
                "text": "🔐 Hi {{1}}, a security code was requested for your account. If you didn't request this, please ignore this message."
            },
            {
                "type": "FOOTER",
                "text": "Do not share this with anyone"
            }
        ]
    },
    {
        "id": "default_two_factor_enabled",
        "name": "two_factor_enabled",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account or product protection",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, two-factor authentication has been enabled on your account on {{2}}. This adds an extra layer of security."
            },
            {
                "type": "FOOTER",
                "text": "Account Security"
            }
        ]
    },
    {
        "id": "default_data_breach_notification",
        "name": "data_breach_notification",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account or product protection",
        "components": [
            {
                "type": "BODY",
                "text": "⚠️ Important Security Notice: We detected a potential data exposure. As a precaution, we recommend changing your password immediately."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Change Password",
                        "url": "https://example.com/password"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_device_verification",
        "name": "device_verification",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account or product protection",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, a new device ({{2}}) was added to your account on {{3}}. If this wasn't you, please remove it."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "That was me"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "Not me"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_account_creation_confirmation_1",
        "name": "account_creation_confirmation_1",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}},\n\nYour new account has been created successfully.\n\nPlease verify {{2}} to complete your profile."
            },
            {
                "type": "FOOTER",
                "text": "Welcome aboard!"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Verify account",
                        "url": "https://example.com/verify"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_account_creation_confirmation_2",
        "name": "account_creation_confirmation_2",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Welcome {{1}}! 🎉\n\nYour account is now active. Here are your next steps:\n\n1. Complete your profile\n2. Set up preferences\n3. Explore features"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Get Started",
                        "url": "https://example.com/start"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_account_creation_confirmation_3",
        "name": "account_creation_confirmation_3",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}},\n\nYour new account has been created successfully.\n\nPlease verify {{2}} to complete your profile."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Verify account",
                        "url": "https://example.com/verify"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_address_update",
        "name": "address_update",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your delivery address has been successfully updated to {{2}}. Contact {{3}} for any inquiries."
            },
            {
                "type": "FOOTER",
                "text": "Address Updated"
            }
        ]
    },
    {
        "id": "default_profile_update_confirmation",
        "name": "profile_update_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your profile has been updated successfully on {{2}}. Changes:\n\n{{3}}"
            },
            {
                "type": "FOOTER",
                "text": "Profile Update"
            }
        ]
    },
    {
        "id": "default_email_verification",
        "name": "email_verification",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, please verify your email address {{2}} to complete your account setup. This link expires in {{3}} hours."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Verify Email",
                        "url": "https://example.com/verify-email"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_phone_verification",
        "name": "phone_verification",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your phone number {{2}} has been verified successfully. You can now receive notifications on this number."
            },
            {
                "type": "FOOTER",
                "text": "Verification Complete"
            }
        ]
    },
    {
        "id": "default_account_deactivation_notice",
        "name": "account_deactivation_notice",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your account deactivation request has been received. Your account will be deactivated in {{2}} days. You can cancel this anytime."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Cancel Deactivation",
                        "url": "https://example.com/cancel"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_account_deletion_confirmation",
        "name": "account_deletion_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your account has been scheduled for deletion. All data will be removed within {{2}} days. This action cannot be undone."
            },
            {
                "type": "FOOTER",
                "text": "Account Deletion"
            }
        ]
    },
    {
        "id": "default_billing_address_update",
        "name": "billing_address_update",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your billing address has been updated to:\n\n{{2}}\n\nThis will be used for future invoices."
            },
            {
                "type": "FOOTER",
                "text": "Billing Update"
            }
        ]
    },
    {
        "id": "default_account_role_change",
        "name": "account_role_change",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your account role has been changed to {{2}} by {{3}} on {{4}}."
            },
            {
                "type": "FOOTER",
                "text": "Account Update"
            }
        ]
    },
    {
        "id": "default_username_change_confirmation",
        "name": "username_change_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi, your username has been changed from {{1}} to {{2}} on {{3}}. If you didn't make this change, contact support."
            },
            {
                "type": "FOOTER",
                "text": "Account Update"
            }
        ]
    },
    {
        "id": "default_account_reactivation",
        "name": "account_reactivation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, welcome back! Your account has been reactivated. All your data and settings have been restored."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Login Now",
                        "url": "https://example.com/login"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_preferences_update",
        "name": "preferences_update",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your notification preferences have been updated. You will now receive alerts for: {{2}}."
            },
            {
                "type": "FOOTER",
                "text": "Preferences Updated"
            }
        ]
    },
    {
        "id": "default_account_tier_upgrade",
        "name": "account_tier_upgrade",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Account updates",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, congratulations! Your account has been upgraded to {{2}} tier. Enjoy enhanced features and benefits."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Benefits",
                        "url": "https://example.com/benefits"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_call_request",
        "name": "call_request",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Call permissions",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, {{2}} is requesting a call with you regarding {{3}}. Please confirm your availability."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "Accept"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "Decline"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_call_scheduled",
        "name": "call_scheduled",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Call permissions",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your call with {{2}} has been scheduled for {{3}} at {{4}}. You will receive a reminder before the call."
            },
            {
                "type": "FOOTER",
                "text": "Call Scheduled"
            }
        ]
    },
    {
        "id": "default_missed_call_followup",
        "name": "missed_call_followup",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Call permissions",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, you missed a call from {{2}} on {{3}}. Would you like to schedule a callback?"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "Schedule Callback"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "Not Now"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_call_recording_notice",
        "name": "call_recording_notice",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Call permissions",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your call on {{2}} has been recorded as per our policy. You can access the recording here."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Recording",
                        "url": "https://example.com/recording"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_call_permission_granted",
        "name": "call_permission_granted",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Call permissions",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, you have been granted permission to make calls through {{2}}. Your calling feature is now active."
            },
            {
                "type": "FOOTER",
                "text": "Call Permission"
            }
        ]
    },
    {
        "id": "default_feedback_survey_1",
        "name": "feedback_survey_1",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Customer feedback",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, how was your recent experience with {{2}}? We'd love to hear your feedback to improve our services."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Share Feedback",
                        "url": "https://example.com/feedback"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_feedback_survey_2",
        "name": "feedback_survey_2",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Customer feedback",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, you recently purchased {{2}}. How would you rate your experience? Your feedback helps us serve you better."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "⭐ Excellent"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "👍 Good"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "👎 Poor"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_feedback_survey_3",
        "name": "feedback_survey_3",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Customer feedback",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, thank you for contacting our support team. How would you rate the assistance you received from {{2}}?"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Rate Support",
                        "url": "https://example.com/rate"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_nps_survey",
        "name": "nps_survey",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Customer feedback",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, on a scale of 0-10, how likely are you to recommend {{2}} to a friend or colleague? Tap below to respond."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Take Survey",
                        "url": "https://example.com/nps"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_support_rating",
        "name": "support_rating",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Customer feedback",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your support ticket #{{2}} has been resolved. How satisfied are you with the resolution?"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "😀 Satisfied"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "😐 Neutral"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "😞 Unsatisfied"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_post_purchase_review",
        "name": "post_purchase_review",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Customer feedback",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, we hope you're enjoying {{2}}! Would you mind leaving a review? It helps other customers and means a lot to us."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Leave Review",
                        "url": "https://example.com/review"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_service_feedback",
        "name": "service_feedback",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Customer feedback",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, how was your recent service appointment on {{2}}? Your feedback helps us maintain quality."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Give Feedback",
                        "url": "https://example.com/service-feedback"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_product_satisfaction",
        "name": "product_satisfaction",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Customer feedback",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, you've been using {{2}} for {{3}} days. How is it working for you? We value your opinion."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "Love it!"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "Need help"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_appointment_reminder_1",
        "name": "appointment_reminder_1",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Event reminder",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}},\n\nThis is a reminder for your upcoming appointment:\n\n📅 Date: {{2}}\n⏰ Time: {{3}}\n📍 Location: {{4}}\n\nPlease arrive 10 minutes early."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "Confirm"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "Reschedule"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_appointment_reminder_2",
        "name": "appointment_reminder_2",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Event reminder",
        "components": [
            {
                "type": "BODY",
                "text": "Reminder: Your appointment with {{1}} is tomorrow at {{2}}. Please bring {{3}} for verification."
            },
            {
                "type": "FOOTER",
                "text": "Appointment Reminder"
            }
        ]
    },
    {
        "id": "default_appointment_cancelled",
        "name": "appointment_cancelled",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Event reminder",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}},\n\nYour appointment on {{2}} has been cancelled. We hope to see you again soon."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "Rebook"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_appointment_rescheduled",
        "name": "appointment_rescheduled",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Event reminder",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}},\n\nYour appointment has been rescheduled:\n\n📅 New Date: {{2}}\n⏰ New Time: {{3}}\n📍 Location: {{4}}"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "Confirm"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "Cancel"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_event_confirmation",
        "name": "event_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Event reminder",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, you're confirmed for {{2}} on {{3}} at {{4}}. We look forward to seeing you!"
            },
            {
                "type": "FOOTER",
                "text": "Event Confirmation"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Details",
                        "url": "https://example.com/event"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_event_reminder",
        "name": "event_reminder",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Event reminder",
        "components": [
            {
                "type": "BODY",
                "text": "📅 Reminder: {{1}} starts in {{2}}!\n\n🕐 Time: {{3}}\n📍 Venue: {{4}}\n\nDon't forget to bring your ticket."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Ticket",
                        "url": "https://example.com/ticket"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_event_cancelled",
        "name": "event_cancelled",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Event reminder",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, unfortunately {{2}} scheduled for {{3}} has been cancelled. A full refund will be processed within {{4}} days."
            },
            {
                "type": "FOOTER",
                "text": "Event Cancellation"
            }
        ]
    },
    {
        "id": "default_webinar_reminder",
        "name": "webinar_reminder",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Event reminder",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your webinar \"{{2}}\" starts in {{3}} minutes. Click below to join now."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Join Webinar",
                        "url": "https://example.com/webinar"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_class_reminder",
        "name": "class_reminder",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Event reminder",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, reminder: Your {{2}} class is scheduled for {{3}} at {{4}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "I'll be there"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "Can't make it"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_meeting_reminder",
        "name": "meeting_reminder",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Event reminder",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, you have a meeting with {{2}} in {{3}} minutes. Agenda: {{4}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Join Meeting",
                        "url": "https://example.com/meet"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_group_join_invitation_1",
        "name": "group_join_invitation_1",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Group invitation link",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, you've been invited to join the group \"{{2}}\". Click below to join and connect with other members."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Join Group",
                        "url": "https://example.com/group"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_group_join_invitation_2",
        "name": "group_join_invitation_2",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Group invitation link",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, {{2}} has invited you to join \"{{3}}\". Join now to stay updated with group activities."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Accept Invitation",
                        "url": "https://example.com/invite"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_community_welcome",
        "name": "community_welcome",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Group invitation link",
        "components": [
            {
                "type": "BODY",
                "text": "Welcome to {{1}}! 🎉\n\nHere you'll find:\n✅ {{2}}\n✅ {{3}}\n✅ {{4}}\n\nIntroduce yourself in the group!"
            },
            {
                "type": "FOOTER",
                "text": "Community Welcome"
            }
        ]
    },
    {
        "id": "default_group_event_invite",
        "name": "group_event_invite",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Group invitation link",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, the group \"{{2}}\" is hosting {{3}} on {{4}}. Join us!"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "I'm in!"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "Can't join"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_terms_update_1",
        "name": "terms_update_1",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Legal / regulatory compliance",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, we've updated our Terms of Service effective {{2}}. Please review the changes to continue using our services."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Review Terms",
                        "url": "https://example.com/terms"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_terms_update_2",
        "name": "terms_update_2",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Legal / regulatory compliance",
        "components": [
            {
                "type": "BODY",
                "text": "Important: Our Terms & Conditions have been updated on {{1}}. Key changes include {{2}}. Your continued use signifies acceptance."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Changes",
                        "url": "https://example.com/terms-changes"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_privacy_policy_update",
        "name": "privacy_policy_update",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Legal / regulatory compliance",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, our Privacy Policy has been updated effective {{2}}. We encourage you to review the changes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Policy",
                        "url": "https://example.com/privacy"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_consent_reminder",
        "name": "consent_reminder",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Legal / regulatory compliance",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, as per regulations, we need to reconfirm your consent for {{2}}. Please review and confirm."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "I Consent"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "Opt Out"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_data_export_ready",
        "name": "data_export_ready",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Legal / regulatory compliance",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your data export request has been processed. You can download your data using the link below. This link expires in {{2}} hours."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Download Data",
                        "url": "https://example.com/download"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_regulatory_notice",
        "name": "regulatory_notice",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Legal / regulatory compliance",
        "components": [
            {
                "type": "BODY",
                "text": "Important Notice: As per {{1}} regulations, we are required to inform you about {{2}}. Please review for compliance."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Learn More",
                        "url": "https://example.com/compliance"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_gdpr_data_request",
        "name": "gdpr_data_request",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Legal / regulatory compliance",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, we received your data access request on {{2}}. Your data report will be ready within {{3}} business days."
            },
            {
                "type": "FOOTER",
                "text": "GDPR Compliance"
            }
        ]
    },
    {
        "id": "default_cookie_consent_update",
        "name": "cookie_consent_update",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Legal / regulatory compliance",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, we've updated our cookie policy. Please review and update your preferences."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Manage Cookies",
                        "url": "https://example.com/cookies"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_order_confirmation_1",
        "name": "order_confirmation_1",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "HEADER",
                "format": "TEXT",
                "text": "Order Confirmed! ✅"
            },
            {
                "type": "BODY",
                "text": "Hi {{1}},\n\nThank you for your order!\n\nOrder ID: {{2}}\nItems: {{3}}\nTotal: {{4}}\n\nWe'll notify you when your order ships."
            },
            {
                "type": "FOOTER",
                "text": "Thank you for shopping with us"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Order",
                        "url": "https://example.com/order"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_order_confirmation_2",
        "name": "order_confirmation_2",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your order #{{2}} has been confirmed! Expected delivery: {{3}}. You can track your order below."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Track Order",
                        "url": "https://example.com/track"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_order_confirmation_3",
        "name": "order_confirmation_3",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Thank you {{1}}! 🎉\n\nOrder #{{2}} confirmed.\nTotal: {{3}}\nPayment: {{4}}\nDelivery by: {{5}}"
            },
            {
                "type": "FOOTER",
                "text": "Order Confirmation"
            }
        ]
    },
    {
        "id": "default_order_shipped",
        "name": "order_shipped",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, great news! Your order #{{2}} has been shipped! 📦\n\nTracking Number: {{3}}\nEstimated Delivery: {{4}}"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Track Shipment",
                        "url": "https://example.com/track"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_order_delivered",
        "name": "order_delivered",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your order #{{2}} has been delivered! We hope you enjoy your purchase. Have feedback?"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "👍 Looks great"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "👎 Issue"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_order_cancelled",
        "name": "order_cancelled",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your order #{{2}} has been cancelled as requested. Refund of {{3}} will be processed within {{4}} business days."
            },
            {
                "type": "FOOTER",
                "text": "Order Cancellation"
            }
        ]
    },
    {
        "id": "default_order_delayed",
        "name": "order_delayed",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, we're sorry but your order #{{2}} is delayed. New estimated delivery: {{3}}. We apologize for the inconvenience."
            },
            {
                "type": "FOOTER",
                "text": "We appreciate your patience"
            }
        ]
    },
    {
        "id": "default_order_action_needed",
        "name": "order_action_needed",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, action is needed for your order #{{2}}. {{3}}. Please respond within {{4}} hours."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Take Action",
                        "url": "https://example.com/action"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_order_pick_up_ready",
        "name": "order_pick_up_ready",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your order #{{2}} is ready for pickup at {{3}}. Please collect it by {{4}}."
            },
            {
                "type": "FOOTER",
                "text": "Pickup Ready"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Get Directions",
                        "url": "https://example.com/store"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_order_or_transaction_cancel",
        "name": "order_or_transaction_cancel",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your transaction/order #{{2}} has been cancelled. Reason: {{3}}. If you have questions, please contact us."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Contact Support",
                        "url": "https://example.com/support"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_return_initiated",
        "name": "return_initiated",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your return for order #{{2}} has been initiated. Return ID: {{3}}. Please ship the item by {{4}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Print Label",
                        "url": "https://example.com/return-label"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_return_received",
        "name": "return_received",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, we've received your returned item for order #{{2}}. Your refund of {{3}} will be processed within {{4}} days."
            },
            {
                "type": "FOOTER",
                "text": "Return Processed"
            }
        ]
    },
    {
        "id": "default_refund_processed",
        "name": "refund_processed",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your refund of {{2}} for order #{{3}} has been processed. It will reflect in your account within {{4}} business days."
            },
            {
                "type": "FOOTER",
                "text": "Refund Confirmation"
            }
        ]
    },
    {
        "id": "default_exchange_confirmation",
        "name": "exchange_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your exchange for order #{{2}} has been confirmed. New item: {{3}}. Expected delivery: {{4}}."
            },
            {
                "type": "FOOTER",
                "text": "Exchange Confirmed"
            }
        ]
    },
    {
        "id": "default_order_modification",
        "name": "order_modification",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your order #{{2}} has been modified as requested. Updated total: {{3}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Updated Order",
                        "url": "https://example.com/order"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_backorder_notification",
        "name": "backorder_notification",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, item {{2}} from your order #{{3}} is on backorder. Expected availability: {{4}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "Keep Waiting"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "Cancel Item"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_order_invoice",
        "name": "order_invoice",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "HEADER",
                "format": "DOCUMENT"
            },
            {
                "type": "BODY",
                "text": "Hi {{1}}, your invoice for order #{{2}} is attached. Amount: {{3}}."
            },
            {
                "type": "FOOTER",
                "text": "Invoice Attached"
            }
        ]
    },
    {
        "id": "default_warranty_confirmation",
        "name": "warranty_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Order management",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your warranty for {{2}} (Order #{{3}}) is now active. Coverage period: {{4}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Warranty",
                        "url": "https://example.com/warranty"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_payment_confirmation_1",
        "name": "payment_confirmation_1",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, we've received your payment of {{2}} for {{3}}.\n\nTransaction ID: {{4}}\nDate: {{5}}\n\nThank you!"
            },
            {
                "type": "FOOTER",
                "text": "Payment Received"
            }
        ]
    },
    {
        "id": "default_payment_confirmation_2",
        "name": "payment_confirmation_2",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "✅ Payment Confirmed\n\nAmount: {{1}}\nMethod: {{2}}\nRef: {{3}}\nDate: {{4}}"
            },
            {
                "type": "FOOTER",
                "text": "Thank you for your payment"
            }
        ]
    },
    {
        "id": "default_payment_reminder_1",
        "name": "payment_reminder_1",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}},\n\nThis is a friendly reminder that your payment of {{2}} for invoice {{3}} is due on {{4}}.\n\nPlease make the payment to avoid any late fees."
            },
            {
                "type": "FOOTER",
                "text": "Ignore if already paid"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Pay Now",
                        "url": "https://example.com/pay"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_payment_reminder_2",
        "name": "payment_reminder_2",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your payment of {{2}} is due in {{3}} days. Pay now to avoid service interruption."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Make Payment",
                        "url": "https://example.com/pay"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_payment_due",
        "name": "payment_due",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your payment of {{2}} for {{3}} is due today. Please process immediately."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Pay Now",
                        "url": "https://example.com/pay"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_payment_overdue",
        "name": "payment_overdue",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "⚠️ Hi {{1}}, your payment of {{2}} for {{3}} is overdue by {{4}} days. Please pay immediately to avoid penalties."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Pay Now",
                        "url": "https://example.com/pay"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_payment_failed",
        "name": "payment_failed",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your payment of {{2}} could not be processed. Reason: {{3}}. Please update your payment method."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Update Payment",
                        "url": "https://example.com/payment-method"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_payment_action_required",
        "name": "payment_action_required",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, additional verification is required for your payment of {{2}}. Please complete the verification."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Verify Payment",
                        "url": "https://example.com/verify-payment"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_auto_pay_reminder",
        "name": "auto_pay_reminder",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your auto-pay of {{2}} will be charged on {{3}} from {{4}}. Ensure sufficient balance."
            },
            {
                "type": "FOOTER",
                "text": "Auto-Pay Reminder"
            }
        ]
    },
    {
        "id": "default_auto_pay_confirmation",
        "name": "auto_pay_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your auto-pay of {{2}} has been processed successfully.\n\nTransaction ID: {{3}}\nNext charge: {{4}}"
            },
            {
                "type": "FOOTER",
                "text": "Auto-Pay"
            }
        ]
    },
    {
        "id": "default_invoice_generated",
        "name": "invoice_generated",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "HEADER",
                "format": "DOCUMENT"
            },
            {
                "type": "BODY",
                "text": "Hi {{1}}, your invoice #{{2}} for {{3}} has been generated. Amount: {{4}}. Due date: {{5}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Invoice",
                        "url": "https://example.com/invoice"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_receipt_generated",
        "name": "receipt_generated",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your payment receipt for {{2}} is ready.\n\nAmount: {{3}}\nDate: {{4}}\nReceipt #: {{5}}"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Download Receipt",
                        "url": "https://example.com/receipt"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_refund_initiated",
        "name": "refund_initiated",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your refund of {{2}} has been initiated. Reference: {{3}}. It will be credited within {{4}} business days."
            },
            {
                "type": "FOOTER",
                "text": "Refund Processing"
            }
        ]
    },
    {
        "id": "default_installment_reminder",
        "name": "installment_reminder",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your installment of {{2}} ({{3}} of {{4}}) is due on {{5}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Pay Installment",
                        "url": "https://example.com/installment"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_payment_method_expiring",
        "name": "payment_method_expiring",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Payment",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your payment method ending in {{2}} expires on {{3}}. Please update to avoid service interruption."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Update Card",
                        "url": "https://example.com/update-card"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_shipping_confirmation_1",
        "name": "shipping_confirmation_1",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Shipping / Delivery",
        "components": [
            {
                "type": "BODY",
                "text": "Your order {{1}} has been shipped! 📦\n\nTracking Number: {{2}}\nEstimated Delivery: {{3}}\n\nTrack your package below."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Track Order",
                        "url": "https://example.com/track"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_shipping_confirmation_2",
        "name": "shipping_confirmation_2",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Shipping / Delivery",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your package is on its way! 🚚\n\nOrder: {{2}}\nCarrier: {{3}}\nTracking: {{4}}\nETA: {{5}}"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Track Package",
                        "url": "https://example.com/track"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_package_in_transit",
        "name": "package_in_transit",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Shipping / Delivery",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your package ({{2}}) is in transit and currently at {{3}}. Expected delivery: {{4}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Live Tracking",
                        "url": "https://example.com/live-track"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_out_for_delivery",
        "name": "out_for_delivery",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Shipping / Delivery",
        "components": [
            {
                "type": "BODY",
                "text": "🚚 Hi {{1}}, your package ({{2}}) is out for delivery! It should arrive today by {{3}}."
            },
            {
                "type": "FOOTER",
                "text": "Almost there!"
            }
        ]
    },
    {
        "id": "default_delivery_confirmation",
        "name": "delivery_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Shipping / Delivery",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your package ({{2}}) has been delivered at {{3}} on {{4}}. Enjoy your purchase!"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "Received"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "Not Received"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_delivery_failed",
        "name": "delivery_failed",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Shipping / Delivery",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, delivery of your package ({{2}}) was unsuccessful. Reason: {{3}}. A new attempt will be made on {{4}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Reschedule",
                        "url": "https://example.com/reschedule"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_delivery_attempt_failed",
        "name": "delivery_attempt_failed",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Shipping / Delivery",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, we attempted to deliver your package ({{2}}) but couldn't reach you. Please schedule a redelivery."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Schedule Redelivery",
                        "url": "https://example.com/redeliver"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_delivery_update",
        "name": "delivery_update",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Shipping / Delivery",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, update on your delivery:\n\nOrder: {{2}}\nStatus: {{3}}\nCurrent Location: {{4}}\nNew ETA: {{5}}"
            },
            {
                "type": "FOOTER",
                "text": "Delivery Update"
            }
        ]
    },
    {
        "id": "default_customs_clearance",
        "name": "customs_clearance",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Shipping / Delivery",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your international shipment ({{2}}) is undergoing customs clearance. This may take {{3}} days."
            },
            {
                "type": "FOOTER",
                "text": "Customs Processing"
            }
        ]
    },
    {
        "id": "default_tracking_update",
        "name": "tracking_update",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Shipping / Delivery",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, tracking update for {{2}}:\n\n📍 {{3}}\n🕐 {{4}}\nStatus: {{5}}"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Full Tracking",
                        "url": "https://example.com/tracking"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_rate_limit_warning",
        "name": "rate_limit_warning",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Messaging limits",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, you are approaching your messaging limit for {{2}}. Current usage: {{3}} of {{4}}."
            },
            {
                "type": "FOOTER",
                "text": "Messaging Limits"
            }
        ]
    },
    {
        "id": "default_quota_exceeded",
        "name": "quota_exceeded",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Messaging limits",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your messaging quota for {{2}} has been reached. Messages will resume on {{3}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Upgrade Plan",
                        "url": "https://example.com/upgrade"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_messaging_limit_reset",
        "name": "messaging_limit_reset",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Messaging limits",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your messaging limits have been reset. You can now send up to {{2}} messages this {{3}}."
            },
            {
                "type": "FOOTER",
                "text": "Limits Reset"
            }
        ]
    },
    {
        "id": "default_product_update",
        "name": "product_update",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Catalogue",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, the product you're interested in ({{2}}) has been updated. Check out the new features!"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Product",
                        "url": "https://example.com/product"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_back_in_stock",
        "name": "back_in_stock",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Catalogue",
        "components": [
            {
                "type": "BODY",
                "text": "🎉 Hi {{1}}, great news! {{2}} is back in stock! Limited quantities available."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Buy Now",
                        "url": "https://example.com/buy"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_price_drop_alert",
        "name": "price_drop_alert",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Catalogue",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, the price of {{2}} has dropped from {{3}} to {{4}}! Grab it before the price goes back up."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Shop Now",
                        "url": "https://example.com/shop"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_low_stock_alert",
        "name": "low_stock_alert",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Catalogue",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, only {{2}} units left of {{3}}! Don't miss out."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Order Now",
                        "url": "https://example.com/order"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_new_arrival_notification",
        "name": "new_arrival_notification",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Catalogue",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, check out our new arrival: {{2}}! Available now at {{3}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Item",
                        "url": "https://example.com/new"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_catalogue_update",
        "name": "catalogue_update",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Catalogue",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, our catalogue has been updated with {{2}} new items in {{3}} category. Browse the latest additions!"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Browse Catalogue",
                        "url": "https://example.com/catalogue"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_booking_confirmation",
        "name": "booking_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Reservation",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your booking is confirmed! 🎉\n\nBooking ID: {{2}}\nDate: {{3}}\nTime: {{4}}\nLocation: {{5}}"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Booking",
                        "url": "https://example.com/booking"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_check_in_reminder",
        "name": "check_in_reminder",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Reservation",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, reminder: Check-in for your stay at {{2}} is on {{3}} at {{4}}. Looking forward to welcoming you!"
            },
            {
                "type": "FOOTER",
                "text": "Check-in Reminder"
            }
        ]
    },
    {
        "id": "default_reservation_updated",
        "name": "reservation_updated",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Reservation",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your reservation #{{2}} has been updated.\n\nNew Date: {{3}}\nNew Time: {{4}}\nGuests: {{5}}"
            },
            {
                "type": "FOOTER",
                "text": "Reservation Updated"
            }
        ]
    },
    {
        "id": "default_reservation_cancelled",
        "name": "reservation_cancelled",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Reservation",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your reservation #{{2}} for {{3}} has been cancelled. Cancellation ID: {{4}}."
            },
            {
                "type": "FOOTER",
                "text": "Reservation Cancelled"
            }
        ]
    },
    {
        "id": "default_table_ready",
        "name": "table_ready",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Reservation",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your table at {{2}} is ready! Please proceed to the host stand. Party of {{3}}."
            },
            {
                "type": "FOOTER",
                "text": "Table Ready"
            }
        ]
    },
    {
        "id": "default_checkout_reminder",
        "name": "checkout_reminder",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Reservation",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, reminder: Checkout from {{2}} is at {{3}} tomorrow. We hope you enjoyed your stay!"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "QUICK_REPLY",
                        "text": "Late Checkout"
                    },
                    {
                        "type": "QUICK_REPLY",
                        "text": "On Time"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_ticket_confirmation",
        "name": "ticket_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Ticket / Pass",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your ticket has been confirmed! 🎫\n\nEvent: {{2}}\nDate: {{3}}\nSeat: {{4}}\nVenue: {{5}}"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Ticket",
                        "url": "https://example.com/ticket"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_boarding_pass",
        "name": "boarding_pass",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Ticket / Pass",
        "components": [
            {
                "type": "HEADER",
                "format": "DOCUMENT"
            },
            {
                "type": "BODY",
                "text": "Hi {{1}},\n\nYour boarding pass is ready! ✈️\n\nFlight: {{2}}\nDate: {{3}}\nDeparture: {{4}}\nArrival: {{5}}\n\nPlease find your boarding pass attached."
            },
            {
                "type": "FOOTER",
                "text": "Have a safe flight!"
            }
        ]
    },
    {
        "id": "default_event_ticket",
        "name": "event_ticket",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Ticket / Pass",
        "components": [
            {
                "type": "HEADER",
                "format": "IMAGE"
            },
            {
                "type": "BODY",
                "text": "Your tickets are confirmed 🎬\n\nEvent: {{1}}\nDate: {{2}}\nTime: {{3}}\nSeats: {{4}}\nVenue: {{5}}\n\nShow this message at the counter."
            },
            {
                "type": "FOOTER",
                "text": "Enjoy!"
            }
        ]
    },
    {
        "id": "default_e_ticket",
        "name": "e_ticket",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Ticket / Pass",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your e-ticket for {{2}} on {{3}} is ready. Ticket #: {{4}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Download E-Ticket",
                        "url": "https://example.com/eticket"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_transit_pass",
        "name": "transit_pass",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Ticket / Pass",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your transit pass for {{2}} is active from {{3}} to {{4}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Pass",
                        "url": "https://example.com/pass"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_parking_pass",
        "name": "parking_pass",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Ticket / Pass",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your parking pass for {{2}} on {{3}} is confirmed. Spot: {{4}}."
            },
            {
                "type": "FOOTER",
                "text": "Parking Confirmed"
            }
        ]
    },
    {
        "id": "default_subscription_confirmation",
        "name": "subscription_confirmation",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Subscription",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your subscription to {{2}} has been activated! 🎉\n\nPlan: {{3}}\nStart: {{4}}\nBilling: {{5}}"
            },
            {
                "type": "FOOTER",
                "text": "Subscription Active"
            }
        ]
    },
    {
        "id": "default_renewal_reminder",
        "name": "renewal_reminder",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Subscription",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your {{2}} subscription will renew on {{3}} for {{4}}. Ensure your payment method is up to date."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Manage Subscription",
                        "url": "https://example.com/subscription"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_plan_expiring",
        "name": "plan_expiring",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Subscription",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your {{2}} plan expires on {{3}}. Renew now to continue enjoying uninterrupted service."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Renew Now",
                        "url": "https://example.com/renew"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_trial_ending",
        "name": "trial_ending",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Subscription",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your free trial of {{2}} ends on {{3}}. Upgrade to continue accessing premium features."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Upgrade Now",
                        "url": "https://example.com/upgrade"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_subscription_cancelled",
        "name": "subscription_cancelled",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Subscription",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your subscription to {{2}} has been cancelled. You can continue using the service until {{3}}."
            },
            {
                "type": "FOOTER",
                "text": "Subscription Cancelled"
            }
        ]
    },
    {
        "id": "default_upgrade_available",
        "name": "upgrade_available",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Subscription",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, a new {{2}} plan is available with {{3}}. Current plan: {{4}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Compare Plans",
                        "url": "https://example.com/plans"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_subscription_paused",
        "name": "subscription_paused",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Subscription",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your {{2}} subscription has been paused. You can resume anytime. Paused until: {{3}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Resume",
                        "url": "https://example.com/resume"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_plan_downgraded",
        "name": "plan_downgraded",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Subscription",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your plan has been downgraded to {{2}} effective {{3}}. Some features may no longer be available."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Plan",
                        "url": "https://example.com/plan"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_membership_renewal",
        "name": "membership_renewal",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Subscription",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your {{2}} membership has been renewed until {{3}}. Thank you for being a valued member!"
            },
            {
                "type": "FOOTER",
                "text": "Membership Active"
            }
        ]
    },
    {
        "id": "default_hello_world",
        "name": "hello_world",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "HEADER",
                "format": "TEXT",
                "text": "Hello World"
            },
            {
                "type": "BODY",
                "text": "Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us."
            },
            {
                "type": "FOOTER",
                "text": "WhatsApp Business Platform"
            }
        ]
    },
    {
        "id": "default_issue_resolution",
        "name": "issue_resolution",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, we're sorry you're experiencing issues with your recent order {{2}}. Our team is looking into it and will get back to you within 24 hours.\n\nTicket ID: {{3}}"
            },
            {
                "type": "FOOTER",
                "text": "We appreciate your patience"
            }
        ]
    },
    {
        "id": "default_service_outage_notification",
        "name": "service_outage_notification",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "BODY",
                "text": "⚠️ Service Notice: {{1}} is currently experiencing issues. Our team is working to resolve this. Estimated recovery: {{2}}."
            },
            {
                "type": "FOOTER",
                "text": "Service Update"
            }
        ]
    },
    {
        "id": "default_service_restored",
        "name": "service_restored",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "BODY",
                "text": "✅ {{1}} has been restored and is operating normally. Thank you for your patience. If you still have issues, contact support."
            },
            {
                "type": "FOOTER",
                "text": "Service Restored"
            }
        ]
    },
    {
        "id": "default_document_ready",
        "name": "document_ready",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your requested document ({{2}}) is ready for download. This link expires in {{3}} hours."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Download",
                        "url": "https://example.com/download"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_verification_complete",
        "name": "verification_complete",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your {{2}} verification has been completed successfully on {{3}}."
            },
            {
                "type": "FOOTER",
                "text": "Verification Complete"
            }
        ]
    },
    {
        "id": "default_account_statement",
        "name": "account_statement",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "HEADER",
                "format": "DOCUMENT"
            },
            {
                "type": "BODY",
                "text": "Hi {{1}}, your account statement for {{2}} is ready. Opening Balance: {{3}}, Closing Balance: {{4}}."
            },
            {
                "type": "FOOTER",
                "text": "Account Statement"
            }
        ]
    },
    {
        "id": "default_low_balance_warning",
        "name": "low_balance_warning",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "BODY",
                "text": "⚠️ Hi {{1}}, your account balance is low at {{2}}. Please top up to avoid service interruption."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Add Funds",
                        "url": "https://example.com/topup"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_password_reset",
        "name": "password_reset",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your password has been reset successfully on {{2}}. If you didn't make this change, contact support immediately."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Contact Support",
                        "url": "https://example.com/support"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_kyc_reminder",
        "name": "kyc_reminder",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, please complete your KYC verification by {{2}} to avoid account restrictions."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Complete KYC",
                        "url": "https://example.com/kyc"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_referral_reward",
        "name": "referral_reward",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your referral for {{2}} was successful! You've earned {{3}}. Keep sharing!"
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "Refer More",
                        "url": "https://example.com/refer"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_maintenance_notice",
        "name": "maintenance_notice",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, scheduled maintenance for {{2}} will occur on {{3}} from {{4}} to {{5}}. Services may be temporarily unavailable."
            },
            {
                "type": "FOOTER",
                "text": "Maintenance Notice"
            }
        ]
    },
    {
        "id": "default_report_ready",
        "name": "report_ready",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your {{2}} report is ready. Period: {{3}} to {{4}}."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": "View Report",
                        "url": "https://example.com/report"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_coupon_expiry",
        "name": "coupon_expiry",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            { "type": "BODY", "text": "Hi {{1}}, your coupon code {{2}} worth {{3}} expires on {{4}}. Use it before it's gone!" },
            { "type": "BUTTONS", "buttons": [{ "type": "URL", "text": "Use Coupon", "url": "https://example.com/coupon" }] }
        ]
    },
    {
        "id": "default_loyalty_points_update",
        "name": "loyalty_points_update",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            { "type": "BODY", "text": "Hi {{1}}, you've earned {{2}} loyalty points! Your total balance is now {{3}} points. Redeem them anytime." },
            { "type": "FOOTER", "text": "Loyalty Program" }
        ]
    },
    {
        "id": "default_waitlist_update",
        "name": "waitlist_update",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            { "type": "BODY", "text": "Hi {{1}}, great news! You've moved up on the waitlist for {{2}}. Your current position: {{3}}." },
            { "type": "FOOTER", "text": "Waitlist Update" }
        ]
    },
    {
        "id": "default_appointment_followup",
        "name": "appointment_followup",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "Event reminder",
        "components": [
            { "type": "BODY", "text": "Hi {{1}}, thank you for your visit on {{2}}. Your next appointment is recommended in {{3}}. Would you like to book?" },
            { "type": "BUTTONS", "buttons": [{ "type": "QUICK_REPLY", "text": "Book Now" }, { "type": "QUICK_REPLY", "text": "Later" }] }
        ]
    },
    {
        "id": "default_service_completion",
        "name": "service_completion",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "General Utility",
        "components": [
            { "type": "BODY", "text": "Hi {{1}}, your service request #{{2}} has been completed. Summary: {{3}}. If you need anything else, let us know." },
            { "type": "FOOTER", "text": "Service Completed" }
        ]
    },
    {
        "id": "default_otp_verification_1",
        "name": "otp_verification_1",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your verification code is {{1}}. This code expires in 10 minutes. Do not share this code with anyone."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_otp_verification_2",
        "name": "otp_verification_2",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "{{1}} is your one-time password. For security, do not share this OTP with anyone. Valid for {{2}} minutes."
            }
        ]
    },
    {
        "id": "default_otp_verification_3",
        "name": "otp_verification_3",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your OTP is {{1}}. Use this to complete your verification. Expires in {{2}} minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy OTP"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_login_verification_1",
        "name": "login_verification_1",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Hi {{1}}, your login verification code is {{2}}. This code will expire in 5 minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_login_verification_2",
        "name": "login_verification_2",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your login code is {{1}}. If you didn't request this, please ignore this message."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_email_otp",
        "name": "email_otp",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your email verification code is {{1}}. Enter this code to verify your email address. Valid for {{2}} minutes."
            }
        ]
    },
    {
        "id": "default_phone_otp",
        "name": "phone_otp",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your phone verification code is {{1}}. Enter this on the verification page. Expires in {{2}} minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_two_factor_code_1",
        "name": "two_factor_code_1",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your two-factor authentication code is {{1}}. Do not share this with anyone. Valid for 5 minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_two_factor_code_2",
        "name": "two_factor_code_2",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "2FA Code: {{1}}\n\nThis code expires in {{2}} minutes. If you didn't request this, secure your account."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_password_reset_otp",
        "name": "password_reset_otp",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your password reset code is {{1}}. If you didn't request a password reset, please ignore this message."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_transaction_otp",
        "name": "transaction_otp",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your transaction verification code is {{1}}. Amount: {{2}}. Do not share this code. Valid for {{3}} minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_registration_otp",
        "name": "registration_otp",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Welcome! Your registration code is {{1}}. Enter this to complete your signup. Expires in {{2}} minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_device_auth_code",
        "name": "device_auth_code",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your device authorization code is {{1}}. Enter this on your new device to link it. Valid for {{2}} minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_pin_reset_code",
        "name": "pin_reset_code",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your PIN reset code is {{1}}. Use this to set a new PIN. This code expires in {{2}} minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_account_recovery_code",
        "name": "account_recovery_code",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your account recovery code is {{1}}. Use this to regain access to your account. Valid for {{2}} minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_biometric_fallback_otp",
        "name": "biometric_fallback_otp",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your fallback verification code is {{1}}. Use this when biometric authentication is unavailable. Expires in {{2}} minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_api_key_verification",
        "name": "api_key_verification",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your API key verification code is {{1}}. Enter this to activate your new API key. Valid for {{2}} minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_withdrawal_otp",
        "name": "withdrawal_otp",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your withdrawal verification code is {{1}}. Amount: {{2}}. Do not share this code. Valid for 5 minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    },
    {
        "id": "default_identity_verification",
        "name": "identity_verification",
        "category": "AUTHENTICATION",
        "language": "en_US",
        "status": "APPROVED",
        "isDefault": true,
        "group": "OTP / Verification",
        "components": [
            {
                "type": "BODY",
                "text": "Your identity verification code is {{1}}. Complete the verification within {{2}} minutes."
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "COPY_CODE",
                        "text": "Copy Code"
                    }
                ]
            }
        ]
    }
];
