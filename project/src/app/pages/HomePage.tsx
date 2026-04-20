import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";

export function HomePage() {
  const { userRole } = useApp();

  return (
    <div className="container mx-auto px-6 py-20">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <h1 className="text-6xl tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Fund RWA Tokenization Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Issue, manage, and trade tokenized fund assets on-chain with institutional-grade infrastructure.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex gap-4 justify-center"
        >
          <Link
            to="/funds"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Open Funds Workspace
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={userRole === "issuer" ? "/create/fund-issuance" : "/marketplace/fund-issuance"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-white font-medium hover:bg-secondary transition-colors"
          >
            {userRole === "issuer" ? "Create New Fund" : "Explore Marketplace"}
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {[
            {
              icon: TrendingUp,
              bgColor: "var(--navy-50)",
              iconColor: "var(--navy-700)",
              title: "Compliant Issuance",
              description: "Launch open-end or closed-end funds with full regulatory compliance and investor protection.",
            },
            {
              icon: Shield,
              bgColor: "var(--gold-50)",
              iconColor: "var(--gold-600)",
              title: "Secure Custody",
              description: "Self-custodial wallet integration with institutional-grade asset protection and settlement.",
            },
            {
              icon: Zap,
              bgColor: "var(--navy-50)",
              iconColor: "var(--navy-700)",
              title: "Instant Settlement",
              description: "On-chain allocation and acceptance with real-time transparency and automated workflows.",
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="space-y-3 p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: feature.bgColor }}
                >
                  <Icon className="w-6 h-6" style={{ color: feature.iconColor }} />
                </div>
                <h3>{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
