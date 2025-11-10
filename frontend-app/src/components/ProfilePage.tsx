import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { User, Mail, Phone, Package, GraduationCap, Calendar, DollarSign, Edit2, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

// Mock services (replace with actual API calls)
const orderService = {
  getUserOrders: async (userId: number) => {
    return [];
  }
};

const enrollmentService = {
  getUserEnrollments: async (userId: number) => {
    return [];
  }
};

interface Order {
  id: string;
  order_number: string;
  status: string;
  order_date: string;
  total_amount: number;
  payment_status: string;
  items: Array<{
    product_name: string;
    quantity: number;
    total_price: number;
  }>;
}

interface Enrollment {
  id: string;
  student_name: string;
  status: string;
  student_age?: number;
  student_grade?: string;
  enrollment_date: string;
  start_date?: string;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: ''
      });
      fetchUserData();
    }
  }, [isAuthenticated, navigate, user, authLoading]);

  const fetchUserData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [ordersData, enrollmentsData] = await Promise.all([
        orderService.getUserOrders(parseInt(user.id)),
        enrollmentService.getUserEnrollments(parseInt(user.id))
      ]);
      setOrders(ordersData);
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = () => {
    // In a real app, this would call an API to update user profile
    toast.success('Profile updated successfully!');
    setEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return (
      <div className="pt-16 min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account, orders, and enrollments</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
   <TabsList className=" w-full ">
  <TabsTrigger value="profile" className="flex items-center justify-center gap-2">
    <User className="w-4 h-4" />
    <span className=" sm:inline text-black">Profile</span>
  </TabsTrigger>
  <TabsTrigger value="orders" className="flex items-center justify-center gap-2">
    <Package className="w-4 h-4" />
    <span className=" sm:inline">Orders</span>
  </TabsTrigger>
  <TabsTrigger value="programs" className="flex items-center justify-center gap-2">
    <GraduationCap className="w-4 h-4" />
    <span className=" sm:inline">Programs</span>
  </TabsTrigger>
</TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </div>
                {!editing ? (
                  <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <Button onClick={handleSaveProfile} size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-purple-600 text-white">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                 
                  <div>
                    <h3 className="text-xl font-semibold">{user?.name}</h3>
                    <p className="text-gray-600">{user?.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        disabled={!editing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!editing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!editing}
                        placeholder="(555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>View all your past orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No orders yet</p>
                    <Button onClick={() => navigate('/products')} className="bg-purple-600 hover:bg-purple-700">
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">Order #{order.order_number}</h3>
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(order.order_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  <span>{order.items.length} item(s)</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 text-2xl font-bold text-purple-600 mb-2">
                                <DollarSign className="w-6 h-6" />
                                {order.total_amount.toFixed(2)}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {order.payment_status}
                              </Badge>
                            </div>
                          </div>
                          {order.items.length > 0 && (
                            <>
                              <Separator className="my-4" />
                              <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span>{item.product_name} (x{item.quantity})</span>
                                    <span className="font-medium">${item.total_price.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs">
            <Card>
              <CardHeader>
                <CardTitle>My Programs</CardTitle>
                <CardDescription>Your enrolled programs and classes</CardDescription>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No program enrollments yet</p>
                    <Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700">
                      Browse Programs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrollments.map((enrollment) => (
                      <Card key={enrollment.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <GraduationCap className="w-5 h-5 text-purple-600" />
                                <h3 className="font-semibold text-lg">{enrollment.student_name}</h3>
                                <Badge className={getStatusColor(enrollment.status)}>
                                  {enrollment.status}
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  {enrollment.student_age && (
                                    <div>
                                      <span className="text-gray-600">Age:</span> <span className="font-medium">{enrollment.student_age}</span>
                                    </div>
                                  )}
                                  {enrollment.student_grade && (
                                    <div>
                                      <span className="text-gray-600">Grade:</span> <span className="font-medium">{enrollment.student_grade}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span>Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
                                </div>
                                {enrollment.start_date && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Starts: {new Date(enrollment.start_date).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
