import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AcceptAllocationModal } from "../components/modals/InvestorModals";

const mockAllocationRecords = [
  {
    id: "alloc-001",
    dealId: "fund-003",
    status: "Success",
    quantity: 1000,
    isAccepted: false,
    allocateTime: "2026-04-10 15:30:00",
  },
  {
    id: "alloc-002",
    dealId: "fund-005",
    status: "Success",
    quantity: 500,
    isAccepted: true,
    allocateTime: "2026-04-08 10:20:00",
  },
];

export function UserCenter() {
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any>(null);

  const handleAccept = (allocation: any) => {
    setSelectedAllocation(allocation);
    setShowAcceptModal(true);
  };

  const handleAcceptSuccess = () => {
    // Update the allocation record
    if (selectedAllocation) {
      selectedAllocation.isAccepted = true;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-heading)' }}>User Center</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile and view all your investment activities.
        </p>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
          <TabsTrigger value="info" className="text-sm">Info</TabsTrigger>
          <TabsTrigger value="issued-token" className="text-sm">Issued Token</TabsTrigger>
          <TabsTrigger value="subscribed-deal" className="text-sm">Subscribed Deal</TabsTrigger>
          <TabsTrigger value="subscription" className="text-sm">Subscription</TabsTrigger>
          <TabsTrigger value="allocation" className="text-sm">Allocation</TabsTrigger>
          <TabsTrigger value="refund" className="text-sm">Refund</TabsTrigger>
          <TabsTrigger value="redemption" className="text-sm">Redemption</TabsTrigger>
          <TabsTrigger value="distribution" className="text-sm">Distribution</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="john.doe@example.com" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Investor Type</Label>
                  <Input value="Institutional" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Jurisdiction</Label>
                  <Input value="United States" disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <Input
                  value="0xa7E4F2c8b9D1e3A5C7F6B2d8E9A1c3F5b7D9e2A4"
                  disabled
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end">
                <Button>Update Information</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issued Token Record Tab */}
        <TabsContent value="issued-token" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issued Token Record</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token ID</TableHead>
                    <TableHead>Token Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No data</p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribed Deal Record Tab */}
        <TabsContent value="subscribed-deal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscribed Deal Record</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal ID</TableHead>
                    <TableHead>Deal Name</TableHead>
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Subscribed Amount</TableHead>
                    <TableHead>Allocated Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No data</p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Record Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Record</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Deal ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Subscribe Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No data</p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocation Record Tab */}
        <TabsContent value="allocation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Allocation Record</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Deal ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Is Accepted</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Allocate Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAllocationRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-xs">{record.id}</TableCell>
                      <TableCell className="font-mono text-xs">{record.dealId}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            record.status === "Success"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.quantity}</TableCell>
                      <TableCell>
                        <Badge
                          variant={record.isAccepted ? "default" : "outline"}
                        >
                          {record.isAccepted ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!record.isAccepted && record.status === "Success" && (
                          <Button
                            size="sm"
                            onClick={() => handleAccept(record)}
                          >
                            Accept
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{record.allocateTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refund Record Tab */}
        <TabsContent value="refund" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Refund Record</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Deal ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Refund Amount</TableHead>
                    <TableHead>Refund Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No data</p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redemption Record Tab */}
        <TabsContent value="redemption" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Redemption Record</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Deal ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Redemption Price</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Redemption Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No data</p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Record Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribution Record</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Deal ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Distribution Amount</TableHead>
                    <TableHead>Commission Amount</TableHead>
                    <TableHead>Received Amount</TableHead>
                    <TableHead>Is Accepted</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Distribution Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">No data</p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AcceptAllocationModal
        open={showAcceptModal}
        onOpenChange={setShowAcceptModal}
        allocation={selectedAllocation}
        onSuccess={handleAcceptSuccess}
      />
    </div>
  );
}
