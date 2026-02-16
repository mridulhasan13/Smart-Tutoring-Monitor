
import React, { useState } from 'react';
import { Student, AppData } from '../types';
import { dbService } from '../services/dbService';

interface StudentsProps {
  data: AppData;
  onRefresh: () => void;
  onEmailConnect: (id: string) => void;
}

const COLORS = ['#2563eb', '#06b6d4', '#7c3aed', '#db2777', '#059669', '#d97706', '#4f46e5', '#be123c'];
const SUBJECTS = ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'ICT', 'Bangla'];

const Students: React.FC<StudentsProps> = ({ data, onRefresh, onEmailConnect }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState({
    name: '',
    phone: '',
    email: '', // Added email
    subject: 'Math',
    grade: '',
    classLevel: '',
    gender: 'Male',
    guardianPhone: '',
    whatsappGroup: '',
    location: { lat: 0, lng: 0, address: '' },
    monthlyPayment: 5000,
    perPersonSalary: 5000, // New field for calculation
    isGroup: false,
    groupSize: 1,
    groupMembers: [] as string[],
    groupData: [] as any[],
    institution: '', // New field for individual/group
    color: COLORS[0],
    whatsappGroupUrl: ''
  });

  const handleLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setNewStudent(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Detected Location'
          }
        }));
        alert("Location node latched successfully.");
      }, (error) => {
        console.error("Error getting location", error);
        alert("Failed to latch location node.");
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleGroupDataChange = (index: number, field: string, value: any) => {
    const updatedGroupData = [...(newStudent.groupData || [])];
    if (!updatedGroupData[index]) updatedGroupData[index] = {};
    updatedGroupData[index][field] = value;
    setNewStudent({ ...newStudent, groupData: updatedGroupData });
  };

  const handleSubjectToggle = (subject: string) => {
    const current = newStudent.subject ? newStudent.subject.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (current.includes(subject)) {
      setNewStudent({ ...newStudent, subject: current.filter(s => s !== subject).join(', ') });
    } else {
      setNewStudent({ ...newStudent, subject: [...current, subject].join(', ') });
    }
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setNewStudent({
      ...student,
      // Ensure mapped fields are correctly set for form
      perPersonSalary: student.groupSize > 0 ? (student.monthlyPayment / student.groupSize) : student.monthlyPayment,
      whatsappGroupUrl: student.whatsappGroupUrl || '',
      groupData: student.groupData || [],
      // Ensure defaults for optional fields if missing
      email: student.email || '',
      guardianPhone: student.guardianPhone || '',
      whatsappGroup: student.whatsappGroup || '',
      location: student.location || { lat: 0, lng: 0, address: '' },
      institution: student.institution || ''
    });
    setShowAddModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalName = newStudent.isGroup ? (newStudent.name || 'Untitled Group') : newStudent.name;

      // For groups, we might want to structure the data differently or use the groupData field
      // verified in dbService.ts

      if (editingId) {
        await dbService.updateStudent(editingId, {
          ...newStudent,
          name: finalName,
          groupMembers: newStudent.isGroup ? newStudent.groupData?.map(s => s.name || 'Student') : []
        });
      } else {
        await dbService.addStudent({
          ...newStudent,
          name: finalName,
          groupMembers: newStudent.isGroup ? newStudent.groupData?.map(s => s.name || 'Student') : []
        });
      }

      setShowAddModal(false);
      setNewStudent({
        name: '', phone: '', email: '', subject: 'Math', grade: '',
        classLevel: '', gender: 'Male', guardianPhone: '', whatsappGroup: '', location: { lat: 0, lng: 0, address: '' },
        monthlyPayment: 5000, perPersonSalary: 5000, isGroup: false, groupSize: 1,
        groupMembers: [], groupData: [], institution: '', color: COLORS[0], whatsappGroupUrl: ''
      });
      setEditingId(null);
      onRefresh();
    } catch (error: any) {
      console.error("Registration Error:", error);
      alert(`Connection Failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Assalamu Alaikum ${name}, tutoring update here!`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#020617] uppercase tracking-tighter">Student Registry</h2>
          <p className="text-slate-500 font-medium">Manage individual learners and group nodes.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:shadow-blue-500/25 flex items-center gap-4 active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <i className="fas fa-plus text-lg relative z-10"></i>
          <span className="relative z-10">Register Node</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.students.length > 0 ? data.students.map(student => (
          <div
            key={student.id}
            className="bg-white rounded-[3.5rem] p-8 border border-slate-100 pro-shadow hover:scale-[1.02] transition-all relative overflow-hidden group"
          >
            {/* Tuition Hover Glow */}
            <div
              className="absolute top-0 right-0 w-48 h-48 blur-[80px] opacity-0 transition-opacity group-hover:opacity-20 pointer-events-none"
              style={{ backgroundColor: student.color || COLORS[0] }}
            ></div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div
                className="w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white text-2xl font-black shadow-lg"
                style={{ backgroundColor: student.color || COLORS[0] }}
              >
                {student.name.charAt(0)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEmailConnect(student.id)}
                  className="p-3.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm"
                  title="Connect via Email"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
                <button
                  onClick={() => handleWhatsApp(student.phone, student.name)}
                  className="p-3.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-2xl transition-all shadow-sm"
                >
                  <i className="fab fa-whatsapp"></i>
                </button>
                <button
                  onClick={() => handleEdit(student)}
                  className="p-3.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"
                >
                  <i className="fas fa-pencil-alt"></i>
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Permanently erase this student data?")) {
                      await dbService.deleteStudent(student.id);
                      onRefresh();
                    }
                  }}
                  className="p-3.5 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <i className="fas fa-trash-can"></i>
                </button>
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <h3 className="text-xl font-black text-[#020617] uppercase tracking-tight truncate">{student.name}</h3>
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border"
                  style={{ color: student.color || COLORS[0], borderColor: `${student.color || COLORS[0]}40`, backgroundColor: `${student.color || COLORS[0]}05` }}
                >
                  {student.subject}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Class {student.grade}
                </span>
              </div>
              {student.institution && (
                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                  <i className="fas fa-university text-slate-300 text-[8px]"></i> {student.institution}
                </p>
              )}
              <p className="text-[10px] font-bold text-slate-400 truncate">{student.email || 'No email connected'}</p>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 space-y-6 relative z-10">
              {student.isGroup && (
                <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Group Members ({student.groupSize})</p>
                  <div className="flex flex-wrap gap-2">
                    {student.groupData && student.groupData.length > 0 ? student.groupData.map((member, idx) => (
                      <div key={idx} className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex flex-col gap-1 shadow-sm">
                        <span className="text-[10px] font-bold text-[#020617]">{member.name || 'Student'}</span>
                        {member.email && <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tight">{member.email}</span>}
                      </div>
                    )) : student.groupMembers?.map((m, idx) => (
                      <span key={idx} className="text-[10px] font-bold text-[#020617] bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Commitment</p>
                  <p className="text-xl font-black text-[#020617]">৳{student.monthlyPayment}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Day Count</p>
                  <p className="text-sm font-bold text-slate-800">
                    {data.sessions.filter(s => s.studentId === student.id).length} Days
                  </p>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-200">
            <i className="fas fa-user-astronaut text-slate-200 text-6xl mb-6"></i>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em]">Registry is currently idle.</p>
            <button onClick={() => setShowAddModal(true)} className="mt-6 text-blue-600 font-black uppercase text-xs tracking-widest hover:underline">Link New Student</button>
          </div>
        )}
      </div>

      {/* Modal - Advanced Student Form */}
      {
        showAddModal && (
          <div className="fixed inset-0 bg-[#020617] z-[100] flex flex-col animate-in slide-in-from-bottom duration-500">
            <div className="bg-white w-full h-full overflow-hidden flex flex-col">
              <div className="p-10 bg-[#020617] text-white flex justify-between items-center relative">
                <div className="absolute top-0 right-0 p-8 bg-blue-500/10 blur-2xl rounded-full w-48 h-48"></div>
                <div className="relative">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Smart Tutoring</h3>
                  <p className="text-blue-400/60 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Registration Portal</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="relative w-10 h-10 rounded-full bg-white/10 hover:bg-rose-500 transition-all flex items-center justify-center text-xs">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-10 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

                {/* Type Selector */}
                <div className="flex gap-4 p-2 bg-slate-50 rounded-[2rem] border border-slate-200 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setNewStudent({ ...newStudent, isGroup: false })}
                    className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!newStudent.isGroup ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStudent({ ...newStudent, isGroup: true })}
                    className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${newStudent.isGroup ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
                  >
                    Group Batch
                  </button>
                </div>

                {newStudent.isGroup ? (
                  <div className="space-y-8 animate-in slide-in-from-top-4">
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Batch Configuration</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Group Title</label>
                          <input required type="text" placeholder="e.g. Science Batch-1" className="w-full px-6 py-4 rounded-[2rem] bg-white border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all text-sm font-bold"
                            value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Node Count</label>
                          <input required type="number" min="2" className="w-full px-6 py-4 rounded-[2rem] bg-white border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all text-sm font-bold"
                            value={newStudent.groupSize}
                            onChange={e => {
                              const size = Number(e.target.value);
                              setNewStudent({ ...newStudent, groupSize: size, groupData: Array(size).fill({}) });
                            }} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Per Person Salary (৳)</label>
                          <input required type="number" className="w-full px-6 py-4 rounded-[2rem] bg-white border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all text-sm font-bold"
                            value={newStudent.perPersonSalary}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setNewStudent({
                                ...newStudent,
                                perPersonSalary: val,
                                monthlyPayment: val * newStudent.groupSize
                              });
                            }} />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Earning</p>
                            <p className="text-2xl font-black text-blue-600">৳{newStudent.monthlyPayment.toLocaleString()}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">WhatsApp Group Link</label>
                          <input type="text" placeholder="https://chat.whatsapp.com/..." className="w-full px-6 py-4 rounded-[2rem] bg-white border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all text-sm font-bold"
                            value={newStudent.whatsappGroup} onChange={e => setNewStudent({ ...newStudent, whatsappGroup: e.target.value })} />
                        </div>
                        <button type="button" onClick={handleLocation} className="w-full py-4 border-2 border-dashed border-blue-200 text-blue-500 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-3">
                          <i className="fas fa-location-crosshairs"></i> {newStudent.location.lat ? 'Location Latched' : 'Auto-Detect Location'}
                        </button>
                        {newStudent.location.lat !== 0 && <p className="text-center text-[9px] font-bold text-slate-400">Lat: {newStudent.location.lat.toFixed(4)}, Lng: {newStudent.location.lng.toFixed(4)}</p>}

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Target Days (Monthly)</label>
                          <input type="number" className="w-full px-6 py-4 rounded-[2rem] bg-white border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all text-sm font-bold"
                            value={newStudent.targetSessions || 12}
                            onChange={e => setNewStudent({ ...newStudent, targetSessions: Number(e.target.value) })} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Subjects Focus</label>
                        <div className="flex flex-wrap gap-2">
                          {SUBJECTS.map(subject => {
                            const isSelected = (newStudent.subject || '').includes(subject);
                            return (
                              <button
                                key={subject}
                                type="button"
                                onClick={() => handleSubjectToggle(subject)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                  : 'bg-white text-slate-400 border-slate-200 hover:border-blue-400 hover:text-blue-500'
                                  }`}
                              >
                                {subject}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Individual Node Data</h4>
                      {Array.from({ length: newStudent.groupSize }).map((_, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-br-2xl">STUDENT-{idx + 1}</div>
                          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" placeholder="Full Name" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500"
                              onChange={(e) => handleGroupDataChange(idx, 'name', e.target.value)} />
                            <input type="text" placeholder="Phone" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500"
                              onChange={(e) => handleGroupDataChange(idx, 'phone', e.target.value)} />
                            <input type="email" placeholder="Email Address" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500"
                              onChange={(e) => handleGroupDataChange(idx, 'email', e.target.value)} />
                            <select className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500"
                              onChange={(e) => handleGroupDataChange(idx, 'gender', e.target.value)}>
                              <option value="Male">Male</option><option value="Female">Female</option>
                            </select>
                            <input type="text" placeholder="Guardian Phone" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500"
                              onChange={(e) => handleGroupDataChange(idx, 'guardianPhone', e.target.value)} />
                            <input type="text" placeholder="Institution" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500 col-span-1 sm:col-span-2"
                              onChange={(e) => handleGroupDataChange(idx, 'institution', e.target.value)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 animate-in slide-in-from-top-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Student Full Name</label>
                      <input required type="text" placeholder="Enter full name..." className="w-full px-6 py-4.5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all text-sm font-bold"
                        value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Class/Grade</label>
                        <input required type="text" placeholder="e.g. 10" className="w-full px-6 py-4.5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all text-sm font-bold"
                          value={newStudent.classLevel} onChange={e => setNewStudent({ ...newStudent, classLevel: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Institution</label>
                        <input required type="text" placeholder="e.g. Dhaka College" className="w-full px-6 py-4.5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all text-sm font-bold"
                          value={newStudent.institution} onChange={e => setNewStudent({ ...newStudent, institution: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Gender</label>
                        <select className="w-full px-6 py-4.5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all text-sm font-bold appearance-none"
                          value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value as any })}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">WhatsApp (+880)</label>
                        <input required type="tel" placeholder="01XXXXXXXXX" className="w-full px-6 py-4.5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                          value={newStudent.phone} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
                        <input type="email" placeholder="student@example.com" className="w-full px-6 py-4.5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                          value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Guardian Phone</label>
                        <input required type="tel" placeholder="01XXXXXXXXX" className="w-full px-6 py-4.5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                          value={newStudent.guardianPhone} onChange={e => setNewStudent({ ...newStudent, guardianPhone: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Monthly Budget (৳)</label>
                        <input required type="number" className="w-full px-6 py-4.5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                          value={newStudent.monthlyPayment} onChange={e => setNewStudent({ ...newStudent, monthlyPayment: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Major Subject</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {SUBJECTS.map(subject => {
                            const isSelected = (newStudent.subject || '').includes(subject);
                            return (
                              <button
                                key={subject}
                                type="button"
                                onClick={() => handleSubjectToggle(subject)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                  : 'bg-white text-slate-400 border-slate-200 hover:border-blue-400 hover:text-blue-500'
                                  }`}
                              >
                                {subject}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Target Days (Monthly)</label>
                      <input type="number" className="w-full px-6 py-4.5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                        value={newStudent.targetSessions || 12}
                        onChange={e => setNewStudent({ ...newStudent, targetSessions: Number(e.target.value) })} />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">WhatsApp Group Link</label>
                      <input type="text" placeholder="https://chat.whatsapp.com/..." className="w-full px-6 py-4.5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold"
                        value={newStudent.whatsappGroup} onChange={e => setNewStudent({ ...newStudent, whatsappGroup: e.target.value })} />
                    </div>

                    <button type="button" onClick={handleLocation} className="w-full py-4 border-2 border-dashed border-blue-200 text-blue-500 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-3">
                      <i className="fas fa-location-crosshairs"></i> {newStudent.location.lat ? 'Location Latched' : 'Auto-Detect Location'}
                    </button>
                    {newStudent.location.lat !== 0 && <p className="text-center text-[9px] font-bold text-slate-400">Lat: {newStudent.location.lat.toFixed(4)}, Lng: {newStudent.location.lng.toFixed(4)}</p>}

                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">visual identity</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewStudent({ ...newStudent, color })}
                        className={`w-10 h-10 rounded-full transition-all border-4 ${newStudent.color === color ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color, boxShadow: newStudent.color === color ? `0 0 20px ${color}60` : 'none' }}
                      >
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#020617] text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-2xl mt-4 active:scale-95"
                >
                  {editingId ? 'Update Connection' : 'Establish Connection'}
                </button>
              </form>
            </div>
          </div >
        )
      }
    </div >
  );
};

export default Students;
