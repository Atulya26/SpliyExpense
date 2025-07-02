/// <reference types="node" />
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Receipt, Calculator, UserPlus, Trash2, Edit3, Check, X } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";

const getEnv = (key: string, fallback: string = ''): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

const ExpenseSharingSystem = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [db, setDb] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Firebase and authenticate user
  useEffect(() => {
    try {
      const appId = getEnv('NEXT_PUBLIC_APP_ID', 'default-expense-app');
      const firebaseConfig = getEnv('NEXT_PUBLIC_FIREBASE_CONFIG')
        ? JSON.parse(getEnv('NEXT_PUBLIC_FIREBASE_CONFIG'))
        : {
            apiKey: "AIzaSyAse2I0D2TlfyXXzhoHTraG5R6QEphllVE",
            authDomain: "spliy-expense-app.firebaseapp.com",
            projectId: "spliy-expense-app",
            storageBucket: "spliy-expense-app.firebasestorage.app",
            messagingSenderId: "530776942195",
            appId: "1:530776942195:web:5838e23c250d5e721e2c06",
            measurementId: "G-9ZCE53653E"
          };

      if (!Object.keys(firebaseConfig).length) {
        setErrorMessage("Firebase configuration is missing. Please ensure NEXT_PUBLIC_FIREBASE_CONFIG is provided.");
        setLoading(false);
        return;
      }

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setLoading(false);
        } else {
          try {
            await signInAnonymously(firebaseAuth);
          } catch (error: any) {
            console.error("Firebase authentication error:", error);
            setErrorMessage(`Authentication failed: ${error.message}`);
            setLoading(false);
          }
        }
      });

      return () => unsubscribeAuth();
    } catch (error: any) {
      console.error("Error initializing Firebase:", error);
      setErrorMessage(`Firebase initialization failed: ${error.message}`);
      setLoading(false);
    }
  }, []);

  // Fetch groups from Firestore
  useEffect(() => {
    if (!db || !userId) return;

    setLoading(true);
    // Public data: /artifacts/{appId}/public/data/groups
    const groupsCollectionRef = collection(db, `artifacts/${getEnv('NEXT_PUBLIC_APP_ID', 'default-expense-app')}/public/data/groups`);

    const unsubscribeGroups = onSnapshot(groupsCollectionRef, (snapshot) => {
      const fetchedGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(fetchedGroups);
      if (!activeGroup && fetchedGroups.length > 0) {
        setActiveGroup(fetchedGroups[0]); // Set first group as active by default
      } else if (activeGroup) {
        // Update active group if its data changed
        const updatedActive = fetchedGroups.find(g => g.id === activeGroup.id);
        if (updatedActive) {
          setActiveGroup(updatedActive);
        } else {
          // If active group was deleted, clear it
          setActiveGroup(null);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching groups:", error);
      setErrorMessage(`Failed to load groups: ${error.message}`);
      setLoading(false);
    });

    return () => unsubscribeGroups();
  }, [db, userId, activeGroup?.id]); // Re-run if db or userId changes, or if activeGroup ID changes

  // Fetch members and expenses for the active group
  useEffect(() => {
    if (!db || !activeGroup?.id) {
      setActiveGroup((prev: any) => prev ? { ...prev, members: [], expenses: [] } : null); // Explicitly type prev as any
      return;
    }

    const appId = getEnv('NEXT_PUBLIC_APP_ID', 'default-expense-app');
    const groupDocRef = doc(db, `artifacts/${appId}/public/data/groups`, activeGroup.id);
    const membersCollectionRef = collection(groupDocRef, 'members');
    const expensesCollectionRef = collection(groupDocRef, 'expenses');

    const unsubscribeMembers = onSnapshot(membersCollectionRef, (snapshot) => {
      const fetchedMembers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActiveGroup((prev: any) => ({ ...prev, members: fetchedMembers }));
    }, (error) => {
      console.error("Error fetching members:", error);
      setErrorMessage(`Failed to load members: ${error.message}`);
    });

    const unsubscribeExpenses = onSnapshot(expensesCollectionRef, (snapshot) => {
      const fetchedExpenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActiveGroup((prev: any) => ({ ...prev, expenses: fetchedExpenses }));
    }, (error) => {
      console.error("Error fetching expenses:", error);
      setErrorMessage(`Failed to load expenses: ${error.message}`);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeExpenses();
    };
  }, [db, activeGroup?.id]);

  // Group management
  const createGroup = async (groupData: { name: string; description: string }) => {
    if (!db || !userId) return;
    try {
      setLoading(true);
      const appId = getEnv('NEXT_PUBLIC_APP_ID', 'default-expense-app');
      const groupsCollectionRef = collection(db, `artifacts/${appId}/public/data/groups`);
      const newGroupRef = await addDoc(groupsCollectionRef, {
        name: groupData.name,
        description: groupData.description,
        createdAt: new Date().toISOString(),
        createdBy: userId,
      });
      // Add the creator as the first member
      const membersCollectionRef = collection(newGroupRef, 'members');
      await addDoc(membersCollectionRef, {
        name: `User ${userId.substring(0, 5)}`, // Default name for creator
        email: '', // No email for anonymous users
        userId: userId,
      });
      setShowCreateGroup(false);
      setLoading(false);
    } catch (error: any) {
      console.error("Error creating group:", error);
      setErrorMessage(`Failed to create group: ${error.message}`);
      setLoading(false);
    }
  };

  const addMemberToGroup = async (memberData: { name: string; email: string }) => {
    if (!db || !activeGroup?.id) return;
    try {
      setLoading(true);
      const appId = getEnv('NEXT_PUBLIC_APP_ID', 'default-expense-app');
      const membersCollectionRef = collection(db, `artifacts/${appId}/public/data/groups/${activeGroup.id}/members`);
      await addDoc(membersCollectionRef, {
        name: memberData.name,
        email: memberData.email,
        // Optionally, add a field to link to a Firebase User ID if they are authenticated
      });
      setShowAddMember(false);
      setLoading(false);
    } catch (error: any) {
      console.error("Error adding member:", error);
      setErrorMessage(`Failed to add member: ${error.message}`);
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!db || !activeGroup?.id) return;
    try {
      setLoading(true);
      const appId = getEnv('NEXT_PUBLIC_APP_ID', 'default-expense-app');
      const memberDocRef = doc(db, `artifacts/${appId}/public/data/groups/${activeGroup.id}/members`, memberId);
      await deleteDoc(memberDocRef);
      setLoading(false);
    } catch (error: any) {
      console.error("Error removing member:", error);
      setErrorMessage(`Failed to remove member: ${error.message}`);
      setLoading(false);
    }
  };

  // Expense management
  const addExpense = async (expenseData: any) => {
    if (!db || !activeGroup?.id) return;
    try {
      setLoading(true);
      const appId = getEnv('NEXT_PUBLIC_APP_ID', 'default-expense-app');
      const expensesCollectionRef = collection(db, `artifacts/${appId}/public/data/groups/${activeGroup.id}/expenses`);
      await addDoc(expensesCollectionRef, {
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        paidBy: expenseData.paidBy,
        splitType: expenseData.splitType,
        splitWith: expenseData.splitWith,
        date: expenseData.date,
        category: expenseData.category,
        createdAt: new Date().toISOString(),
        createdBy: userId,
      });
      setShowAddExpense(false);
      setLoading(false);
    } catch (error: any) {
      console.error("Error adding expense:", error);
      setErrorMessage(`Failed to add expense: ${error.message}`);
      setLoading(false);
    }
  };

  const updateExpense = async (expenseData: any) => {
    if (!db || !activeGroup?.id || !editingExpense?.id) return;
    try {
      setLoading(true);
      const appId = getEnv('NEXT_PUBLIC_APP_ID', 'default-expense-app');
      const expenseDocRef = doc(db, `artifacts/${appId}/public/data/groups/${activeGroup.id}/expenses`, editingExpense.id);
      await updateDoc(expenseDocRef, {
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        paidBy: expenseData.paidBy,
        splitType: expenseData.splitType,
        splitWith: expenseData.splitWith,
        date: expenseData.date,
        category: expenseData.category,
      });
      setEditingExpense(null);
      setLoading(false);
    } catch (error: any) {
      console.error("Error updating expense:", error);
      setErrorMessage(`Failed to update expense: ${error.message}`);
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!db || !activeGroup?.id) return;
    try {
      setLoading(true);
      const appId = getEnv('NEXT_PUBLIC_APP_ID', 'default-expense-app');
      const expenseDocRef = doc(db, `artifacts/${appId}/public/data/groups/${activeGroup.id}/expenses`, expenseId);
      await deleteDoc(expenseDocRef);
      setLoading(false);
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      setErrorMessage(`Failed to delete expense: ${error.message}`);
      setLoading(false);
    }
  };

  // Calculate balances (client-side for now)
  const calculateBalances = useCallback(() => {
    if (!activeGroup || !activeGroup.members || !activeGroup.expenses) return [];

    const balances: { [key: string]: { name: string; balance: number; paid: number; owes: number } } = {};
    activeGroup.members.forEach((member: any) => {
      balances[member.id] = { name: member.name, balance: 0, paid: 0, owes: 0 };
    });

    activeGroup.expenses.forEach((expense: any) => {
      const { paidBy, amount, splitWith, splitType } = expense;

      // Add to paid amount
      if (balances[paidBy]) {
        balances[paidBy].paid += amount;
      }

      // Calculate split amount based on type
      let splitAmount: number = 0;
      if (splitType === 'equal') {
        splitAmount = amount / splitWith.length;
      } else if (splitType === 'custom') {
        // For custom splits, we'd need additional data structure
        splitAmount = amount / splitWith.length; // Fallback to equal
      }

      // Subtract from each person's balance
      splitWith.forEach((memberId: string) => {
        if (balances[memberId]) {
          balances[memberId].owes += splitAmount;
          balances[memberId].balance = balances[memberId].paid - balances[memberId].owes;
        }
      });
    });

    return Object.values(balances);
  }, [activeGroup]);

  // Calculate settlements (client-side for now)
  const calculateSettlements = useCallback(() => {
    const balances = calculateBalances();
    const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

    const settlements: { from: string; to: string; amount: string }[] = [];
    let i = 0, j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.balance, -debtor.balance);

      if (amount > 0.01) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: amount.toFixed(2)
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance < 0.01) i++;
      if (debtor.balance > -0.01) j++;
    }

    return settlements;
  }, [calculateBalances]);

  const getMemberName = useCallback((memberId: string) => {
    const member = activeGroup?.members.find((m: any) => m.id === memberId);
    return member ? member.name : 'Unknown';
  }, [activeGroup?.members]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <span className="text-blue-600 text-xl font-semibold">Loading Expense System...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{errorMessage}</p>
            <p className="text-sm mt-2 text-gray-500">Please ensure Firebase is correctly configured and your network is stable.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100 font-inter">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl flex flex-col p-6 gap-6 min-h-screen">
        <div className="flex items-center gap-3 mb-8">
          <Receipt className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Expense Splitter</span>
        </div>
        <nav className="flex flex-col gap-2">
          <Button variant="ghost" className="justify-start w-full">Groups</Button>
          <Button variant="ghost" className="justify-start w-full">Members</Button>
          <Button variant="ghost" className="justify-start w-full">Expenses</Button>
        </nav>
        <div className="mt-auto">
          {userId && (
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-3 text-xs text-gray-700">
                <span>Your User ID:</span>
                <span className="block font-mono font-semibold text-blue-700 break-all">{userId}</span>
              </CardContent>
            </Card>
          )}
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Cards for Groups, Members, Expenses, Balances, Settlements will go here in next steps */}
        {/* Placeholder for now */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="group-select">Select Group</Label>
                  <Select
                    id="group-select"
                    value={activeGroup?.id || ''}
                    onChange={e => setActiveGroup(groups.find(g => g.id === e.target.value))}
                    className="mt-1"
                  >
                    <option value="">Choose a group...</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2 items-center">
                  <Button onClick={() => setShowCreateGroup(true)}>
                    <Plus className="h-4 w-4 mr-2" /> New Group
                  </Button>
                  {activeGroup && (
                    <span className="text-sm text-gray-600 ml-2">Current: <span className="font-semibold text-blue-700">{activeGroup.name}</span></span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base">Members</Label>
                  <Button variant="outline" onClick={() => setShowAddMember(true)}>
                    <UserPlus className="h-4 w-4 mr-2" /> Add Member
                  </Button>
                </div>
                <div className="space-y-2">
                  {activeGroup && activeGroup.members && activeGroup.members.length > 0 ? (
                    activeGroup.members.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition">
                        <div>
                          <span className="font-medium text-gray-900">{member.name}</span>
                          <span className="ml-2 text-xs text-gray-500">{member.email}</span>
                        </div>
                        <Button variant="ghost" className="text-red-600 hover:text-red-800 p-1" onClick={() => removeMember(member.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">No members yet. Add some!</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base">Expenses</Label>
                  <Button onClick={() => setShowAddExpense(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Expense
                  </Button>
                </div>
                <div className="space-y-2">
                  {activeGroup && activeGroup.expenses && activeGroup.expenses.length > 0 ? (
                    activeGroup.expenses.map((expense: any) => (
                      <Card key={expense.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{expense.description}</span>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" className="text-blue-600 hover:text-blue-800 p-1" onClick={() => setEditingExpense(expense)}>
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" className="text-red-600 hover:text-red-800 p-1" onClick={() => deleteExpense(expense.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Paid by: <span className="font-medium">{getMemberName(expense.paidBy)}</span></span>
                            <span className="font-bold text-lg text-gray-900">${expense.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Split with: {expense.splitWith.map((id: string) => getMemberName(id)).join(', ')}</span>
                            <span>{expense.date}</span>
                          </div>
                          {expense.category && (
                            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {expense.category}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">No expenses yet. Add your first expense to get started!</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const CreateGroupModal = ({ open, onSubmit, onClose }: { open: boolean; onSubmit: (data: { name: string; description: string }) => void; onClose: () => void }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = () => {
    if (formData.name.trim()) {
      onSubmit(formData);
      setFormData({ name: '', description: '' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create New Group">
      <div className="flex flex-col gap-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Weekend Trip, Flatmates"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
            placeholder="Brief description of the group"
            rows={3}
          ></textarea>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Create Group
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  );
};

const AddMemberModal = ({ open, onSubmit, onClose }: { open: boolean; onSubmit: (data: { name: string; email: string }) => void; onClose: () => void }) => {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = () => {
    if (formData.name.trim() && formData.email.trim()) {
      onSubmit(formData);
      setFormData({ name: '', email: '' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Add Member">
      <div className="flex flex-col gap-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Member's name"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Member's email (optional)"
          />
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Add Member
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  );
};

const ExpenseModal = ({ open, members, expense, onSubmit, onClose }: { open: boolean; members: any[]; expense: any; onSubmit: (data: any) => void; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    description: expense?.description || '',
    amount: expense?.amount || '',
    paidBy: expense?.paidBy || (members[0]?.id || ''),
    splitWith: expense?.splitWith || members.map(m => m.id),
    splitType: expense?.splitType || 'equal',
    date: expense?.date || new Date().toISOString().split('T')[0],
    category: expense?.category || ''
  });

  useEffect(() => {
    // Ensure paidBy and splitWith are valid member IDs when members list changes
    if (members.length > 0) {
      if (!formData.paidBy || !members.some(m => m.id === formData.paidBy)) {
        setFormData(prev => ({ ...prev, paidBy: members[0].id }));
      }
      const validSplitWith = formData.splitWith.filter((id: string) => members.some(m => m.id === id));
      if (validSplitWith.length !== formData.splitWith.length) {
        setFormData(prev => ({ ...prev, splitWith: validSplitWith }));
      }
    }
  }, [members, formData.paidBy, formData.splitWith]);

  const handleSplitWithChange = (memberId: string) => {
    setFormData({
      ...formData,
      splitWith: formData.splitWith.includes(memberId)
        ? formData.splitWith.filter((id: string) => id !== memberId)
        : [...formData.splitWith, memberId]
    });
  };

  const handleSubmit = () => {
    if (formData.description.trim() && formData.amount && formData.splitWith.length > 0) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Add Expense">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="What was this expense for?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paid By</label>
            <select
              value={formData.paidBy}
              onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select category...</option>
              <option value="Food">Food</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Transportation">Transportation</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Utilities">Utilities</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Split With</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {members.map(member => (
              <label key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.splitWith.includes(member.id)}
                  onChange={() => handleSplitWithChange(member.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-gray-900">{member.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            {expense ? 'Update Expense' : 'Add Expense'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default ExpenseSharingSystem;
