import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";

export function UserCenter() {
  const { currentInvestor, fundOrders, fundIssuances, fundDistributions } = useApp();

  const investorOrders = fundOrders.filter((order) => order.investorId === currentInvestor.id);
  const subscriptionOrders = investorOrders.filter((order) => order.type === "subscription");
  const redemptionOrders = investorOrders.filter((order) => order.type === "redemption");
  const activeFund = fundIssuances.find((fund) => fund.id === "fund-open-001");

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-heading)" }}>User Center</h1>
        <p className="text-muted-foreground mt-2">
          Track your open-end fund holdings, subscription orders, redemption requests, and settlement progress.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Open Orders</div>
          <div className="text-2xl font-semibold">
            {investorOrders.filter((order) => !["Completed", "Confirmed", "Rejected"].includes(order.status)).length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Subscription Orders</div>
          <div className="text-2xl font-semibold">{subscriptionOrders.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Redemption Orders</div>
          <div className="text-2xl font-semibold">{redemptionOrders.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Current Holdings</div>
          <div className="text-2xl font-semibold">
            {activeFund?.availableHoldingLabel || "0 units"}
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Investor Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={currentInvestor.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Investor Type</Label>
                  <Input value={currentInvestor.investorType} disabled />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Jurisdiction</Label>
                  <Input value={currentInvestor.jurisdiction} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Wallet Address</Label>
                  <Input value={currentInvestor.wallet} disabled className="font-mono text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holdings">
          <Card>
            <CardHeader>
              <CardTitle>Fund Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fund</TableHead>
                    <TableHead>Fund Type</TableHead>
                    <TableHead>Current NAV</TableHead>
                    <TableHead>Holding Units</TableHead>
                    <TableHead>Redemption Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeFund ? (
                    <TableRow>
                      <TableCell className="font-medium">{activeFund.name}</TableCell>
                      <TableCell>{activeFund.fundType}</TableCell>
                      <TableCell>{activeFund.currentNav}</TableCell>
                      <TableCell>{activeFund.availableHoldingLabel}</TableCell>
                      <TableCell>{activeFund.redemptionStatus}</TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No holdings found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>Requested Amount</TableHead>
                    <TableHead>Estimated Shares</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submit Time</TableHead>
                    <TableHead>Settlement Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionOrders.map((order) => {
                    const fund = fundIssuances.find((item) => item.id === order.fundId);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                        <TableCell>{fund?.name || order.fundId}</TableCell>
                        <TableCell>{order.requestAmount}</TableCell>
                        <TableCell>{order.estimatedSharesOrCash}</TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{order.submitTime}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{order.settlementTime || "Pending"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {subscriptionOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No subscription orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redemptions">
          <Card>
            <CardHeader>
              <CardTitle>Redemption Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>Requested Shares</TableHead>
                    <TableHead>Estimated Cash</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submit Time</TableHead>
                    <TableHead>Settlement Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptionOrders.map((order) => {
                    const fund = fundIssuances.find((item) => item.id === order.fundId);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                        <TableCell>{fund?.name || order.fundId}</TableCell>
                        <TableCell>{order.requestQuantity}</TableCell>
                        <TableCell>{order.estimatedSharesOrCash}</TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{order.submitTime}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{order.settlementTime || "Pending"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {redemptionOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No redemption orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions">
          <Card>
            <CardHeader>
              <CardTitle>Distributions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Record Date</TableHead>
                    <TableHead>Payment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundDistributions.map((distribution) => (
                    <TableRow key={distribution.id}>
                      <TableCell className="font-mono text-xs">{distribution.id}</TableCell>
                      <TableCell>{distribution.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={distribution.status} />
                      </TableCell>
                      <TableCell>{distribution.recordDate || "TBD"}</TableCell>
                      <TableCell>{distribution.paymentDate || "TBD"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
