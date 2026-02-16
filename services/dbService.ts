import { supabase } from './supabaseClient';
import { AppData, Student, Session, Payment, Email, TutorProfile, LoginRecord } from '../types';

export const dbService = {
    // --- Data Retrieval ---
    getData: async (): Promise<AppData> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No authenticated user");

        const [
            { data: profile },
            { data: students },
            { data: sessions },
            { data: payments },
            { data: emails },
            { data: logins }
        ] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
            supabase.from('students').select('*').eq('user_id', user.id),
            supabase.from('sessions').select('*').eq('user_id', user.id),
            supabase.from('payments').select('*').eq('user_id', user.id),
            supabase.from('emails').select('*').eq('user_id', user.id),
            supabase.from('login_history').select('*').eq('user_id', user.id).order('timestamp', { ascending: false })
        ]);

        // Map database fields to AppData types if necessary (e.g. snake_case to camelCase)
        // For now assuming the types match or are close enough, but standardizing on camelCase in frontend
        // Supabase returns snake_case by default for columns. We might need a transformer.
        // Let's assume for now we need manual mapping or the types in 'types.ts' need to match DB.
        // The previously defined schema uses snake_case (e.g. user_id, start_time).
        // The types.ts uses camelCase (e.g. userId, startTime).
        // We need to map them.

        const mapStudent = (s: any): Student => ({
            ...s,
            groupMembers: s.group_members,
            whatsappGroupUrl: s.whatsapp_group_url,
            createdAt: s.created_at,
            monthlyPayment: Number(s.monthly_payment),
            isGroup: s.is_group,
            groupSize: s.group_size,
            // New Fields Mapping
            gender: s.gender,
            guardianPhone: s.guardian_phone,
            whatsappGroup: s.whatsapp_group,
            location: {
                lat: s.location_lat,
                lng: s.location_lng,
                address: s.location_address
            },
            groupData: s.group_data,
            classLevel: s.grade, // Mapping grade to classLevel for now
            institution: s.institution,
            targetSessions: s.target_sessions || 12
        });

        const mapSession = (s: any): Session => ({
            ...s,
            studentId: s.student_id,
            studentName: s.student_name,
            startTime: s.start_time,
            endTime: s.end_time,
            subjectTaught: s.subject_taught
        });

        const mapPayment = (p: any): Payment => ({
            ...p,
            studentId: p.student_id,
            studentName: p.student_name,
            dueDate: p.due_date,
            amount: Number(p.amount),
            month: p.payment_month,
            notes: p.notes
        });

        const mapEmail = (e: any): Email => ({
            ...e
        });

        const mapLogin = (l: any): LoginRecord => ({
            ...l
        });

        const mapProfile = (p: any): TutorProfile => ({
            name: p?.full_name || '',
            email: p?.email || '',
            profession: p?.profession || '',
            institution: p?.institution || '',
            school: p?.school || '',
            college: p?.college || '',
            university: p?.university || '',
            level: p?.level || '',
            term: p?.term || '',
            city: p?.city || '',
            contactNumber: p?.contact_number || '',
            yearTerm: p?.year_term || '',
            avatarUrl: p?.avatar_url || ''
        });

        return {
            tutorProfile: profile ? mapProfile(profile) : undefined,
            students: (students || []).map(mapStudent),
            sessions: (sessions || []).map(mapSession),
            payments: (payments || []).map(mapPayment),
            emails: (emails || []).map(mapEmail),
            loginHistory: (logins || []).map(mapLogin)
        };
    },

    // --- Profile ---
    updateProfile: async (profile: TutorProfile) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const updates = {
            full_name: profile.name,
            email: profile.email,
            profession: profile.profession,
            institution: profile.institution,
            school: profile.school,
            college: profile.college,
            university: profile.university,
            level: profile.level,
            term: profile.term,
            city: profile.city,
            contact_number: profile.contactNumber,
            year_term: profile.yearTerm,
            avatar_url: profile.avatarUrl,
            id: user.id
        };

        await supabase.from('profiles').upsert(updates);
    },

    async uploadAvatar(file: File): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = fileName; // Removed redundant 'avatars/' prefix

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async updateAvatarUrl(url: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: url })
            .eq('id', user.id);

        if (error) throw error;
    },
    // --- Students ---
    addStudent: async (student: Omit<Student, 'id' | 'createdAt'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const dbStudent = {
            user_id: user.id,
            name: student.name,
            phone: student.phone,
            email: student.email,
            subject: student.subject,
            grade: student.classLevel || student.grade,
            monthly_payment: student.monthlyPayment,
            is_group: student.isGroup,
            group_size: student.groupSize,
            group_members: student.groupMembers,
            color: student.color,

            whatsapp_group_url: student.whatsappGroupUrl,
            // New Fields
            gender: student.gender,
            guardian_phone: student.guardianPhone,
            whatsapp_group: student.whatsappGroup,
            location_lat: student.location?.lat,
            location_lng: student.location?.lng,
            location_address: student.location?.address,
            group_data: student.groupData,
            institution: student.institution,
            target_sessions: student.targetSessions || 12
        };

        const { data, error } = await supabase.from('students').insert(dbStudent).select().single();
        if (error) throw error;
        return data;
    },

    deleteStudent: async (id: string) => {
        await supabase.from('students').delete().eq('id', id);
    },

    updateStudent: async (id: string, updates: Partial<Student>) => {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.phone) dbUpdates.phone = updates.phone;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.subject) dbUpdates.subject = updates.subject;
        if (updates.grade) dbUpdates.grade = updates.grade; // grade maps to classLevel in UI but stored as grade
        if (updates.classLevel) dbUpdates.grade = updates.classLevel; // handle UI field name
        if (updates.monthlyPayment) dbUpdates.monthly_payment = updates.monthlyPayment;
        if (updates.isGroup !== undefined) dbUpdates.is_group = updates.isGroup;
        if (updates.groupSize) dbUpdates.group_size = updates.groupSize;
        if (updates.groupMembers) dbUpdates.group_members = updates.groupMembers;
        if (updates.color) dbUpdates.color = updates.color;
        if (updates.whatsappGroupUrl) dbUpdates.whatsapp_group_url = updates.whatsappGroupUrl;

        // New Fields
        if (updates.gender) dbUpdates.gender = updates.gender;
        if (updates.guardianPhone) dbUpdates.guardian_phone = updates.guardianPhone;
        if (updates.whatsappGroup) dbUpdates.whatsapp_group = updates.whatsappGroup;
        if (updates.location) {
            dbUpdates.location_lat = updates.location.lat;
            dbUpdates.location_lng = updates.location.lng;
            dbUpdates.location_address = updates.location.address;
        }
        if (updates.groupData) dbUpdates.group_data = updates.groupData;
        if (updates.institution) dbUpdates.institution = updates.institution;
        if (updates.targetSessions) dbUpdates.target_sessions = updates.targetSessions;

        const { error } = await supabase.from('students').update(dbUpdates).eq('id', id);
        if (error) throw error;
    },

    // --- Sessions ---
    addSession: async (session: Omit<Session, 'id'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: student } = await supabase.from('students')
            .select('name')
            .eq('id', session.studentId)
            .single();

        const dbSession = {
            user_id: user.id,
            student_id: session.studentId,
            student_name: student?.name || 'Unknown Student',
            date: session.date,
            start_time: session.startTime,
            end_time: session.endTime,
            duration: session.duration,
            status: session.status,
            subject_taught: session.subjectTaught,
            notes: session.notes
        };

        const { data: newSession, error } = await supabase.from('sessions').insert(dbSession).select().single();
        if (error) throw error;

        // --- Automated Invoicing Logic ---
        try {
            // 1. Get Student Details (Target & Monthly Payment)
            const { data: student } = await supabase.from('students')
                .select('target_sessions, monthly_payment, name, phone, email')
                .eq('id', session.studentId)
                .single();

            if (student) {
                const target = student.target_sessions || 12;
                const paymentAmount = student.monthly_payment || 5000;

                // 2. Count Completed Sessions for Current Month
                const sessionDate = new Date(session.date);
                const startOfMonth = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), 1).toISOString();
                const endOfMonth = new Date(sessionDate.getFullYear(), sessionDate.getMonth() + 1, 0).toISOString();

                const { count } = await supabase.from('sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('student_id', session.studentId)
                    .eq('status', 'completed')
                    .gte('date', startOfMonth)
                    .lte('date', endOfMonth);

                // 3. Check if Target Met
                if ((count || 0) >= target) {
                    // 4. Determine Next Billing Month
                    // Logic: Find the latest payment. If exists, next month is (latest + 1). 
                    // If not, use current month.

                    const { data: lastPayments } = await supabase.from('payments')
                        .select('payment_month, date')
                        .eq('student_id', session.studentId)
                        .order('date', { ascending: false }) // Get latest by date
                        .limit(1);

                    let nextBillingMonth = sessionDate.toLocaleString('default', { month: 'long', year: 'numeric' });

                    if (lastPayments && lastPayments.length > 0 && lastPayments[0].payment_month) {
                        try {
                            const lastMonthStr = lastPayments[0].payment_month; // e.g. "February 2026"
                            const lastMonthDate = new Date(Date.parse(`1 ${lastMonthStr} `)); // "1 February 2026"

                            if (!isNaN(lastMonthDate.getTime())) {
                                // Increment Month
                                lastMonthDate.setMonth(lastMonthDate.getMonth() + 1);
                                nextBillingMonth = lastMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                            }
                        } catch (e) {
                            console.error("Error parsing last payment month:", e);
                        }
                    }

                    // 5. Check if Invoice for *Next* Month already exists (avoid duplicates)
                    const { data: existingPayment } = await supabase.from('payments')
                        .select('id')
                        .eq('student_id', session.studentId)
                        .eq('payment_month', nextBillingMonth)
                        .single();

                    if (!existingPayment) {
                        // 6. Create Automated Invoice
                        const dueDate = new Date();
                        dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

                        await supabase.from('payments').insert({
                            user_id: user.id,
                            student_id: session.studentId,
                            student_name: student.name,
                            amount: paymentAmount,
                            date: new Date().toISOString().split('T')[0],
                            due_date: dueDate.toISOString().split('T')[0],
                            status: 'pending',
                            payment_month: nextBillingMonth,
                            reference: 'AUTO-GENERATED',
                            notes: `Auto - generated for completing ${target} sessions.`
                        });
                    }
                }
            }
        } catch (err) {
            console.error("[Auto-Invoice] Error:", err);
            // Squelch error so session creation doesn't fail
        }

        return newSession;
    },

    deleteSession: async (id: string) => {
        const { error } = await supabase.from('sessions').delete().eq('id', id);
        if (error) throw error;
    },

    updateSession: async (id: string, updates: Partial<Session>) => {
        // Need to map camelCase updates to snake_case column names
        const dbUpdates: any = {};
        if (updates.studentId) dbUpdates.student_id = updates.studentId;
        if (updates.date) dbUpdates.date = updates.date;
        if (updates.startTime) dbUpdates.start_time = updates.startTime;
        if (updates.endTime) dbUpdates.end_time = updates.endTime;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.notes) dbUpdates.notes = updates.notes;
        if (updates.subjectTaught) dbUpdates.subject_taught = updates.subjectTaught;
        if (updates.duration) dbUpdates.duration = updates.duration;

        const { error } = await supabase.from('sessions').update(dbUpdates).eq('id', id);
        if (error) throw error;
    },

    // --- Payments ---
    addPayment: async (payment: Omit<Payment, 'id'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: student } = await supabase.from('students')
            .select('name')
            .eq('id', payment.studentId)
            .single();

        const dbPayment = {
            user_id: user.id,
            student_id: payment.studentId,
            student_name: student?.name || 'Unknown Student',
            amount: payment.amount,
            date: payment.date,
            due_date: payment.dueDate,
            status: payment.status,
            reference: payment.reference,
            payment_month: payment.month
        };

        const { data, error } = await supabase.from('payments').insert(dbPayment).select().single();
        if (error) throw error;
        return data;
    },

    deletePayment: async (id: string) => {
        const { error } = await supabase.from('payments').delete().eq('id', id);
        if (error) throw error;
    },

    updatePayment: async (id: string, updates: Partial<Payment>) => {
        const dbUpdates: any = {};
        if (updates.amount) dbUpdates.amount = updates.amount;
        if (updates.date) dbUpdates.date = updates.date;
        if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.reference) dbUpdates.reference = updates.reference;
        if (updates.month) dbUpdates.payment_month = updates.month;
        if (updates.notes) dbUpdates.notes = updates.notes;

        const { error } = await supabase.from('payments').update(dbUpdates).eq('id', id);
        if (error) throw error;
    },

    updatePaymentStatus: async (id: string, status: Payment['status']) => {
        await supabase.from('payments').update({ status }).eq('id', id);
    },

    // --- Emails ---
    logEmail: async (email: Omit<Email, 'id' | 'timestamp' | 'status'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Silent fail if no user (e.g. system email?)

        const dbEmail = {
            user_id: user.id,
            to: email.to,
            subject: email.subject,
            body: email.body,
            status: 'dispatched'
        };

        await supabase.from('emails').insert(dbEmail);
    },

    deleteEmail: async (id: string) => {
        const { error } = await supabase.from('emails').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Auth & Audit ---
    recordLogin: async (action: 'login' | 'logout' = 'login') => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('login_history').insert({
            user_id: user.id,
            action: action
        });
    },

    deleteUserAccount: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Delete all data associated with user
        await Promise.all([
            supabase.from('students').delete().eq('user_id', user.id),
            supabase.from('sessions').delete().eq('user_id', user.id),
            supabase.from('payments').delete().eq('user_id', user.id),
            supabase.from('emails').delete().eq('user_id', user.id),
            supabase.from('login_history').delete().eq('user_id', user.id),
            supabase.from('profiles').delete().eq('id', user.id)
        ]);

        await supabase.auth.signOut();
    }
};
