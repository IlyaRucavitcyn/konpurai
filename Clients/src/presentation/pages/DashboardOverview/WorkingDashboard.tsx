import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Stack,
  CircularProgress,
  Button,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../../application/hooks/useDashboard';
import { useDashboardMetrics } from '../../../application/hooks/useDashboardMetrics';
import { cardStyles } from '../../themes';
import { useAuth } from '../../../application/hooks/useAuth';
import { getUserById } from '../../../application/repository/user.repository';

import { ReactComponent as RightArrow } from '../../assets/icons/right-arrow.svg';
import StatusDonutChart, { StatusData } from '../../components/Charts/StatusDonutChart';
import { getDefaultStatusDistribution } from '../../utils/statusColors';
import { getDistributionSummary, getQuickStats, hasCriticalItems, getPriorityLevel } from '../../utils/cardEnhancements';
import PageHeader from '../../components/Layout/PageHeader';

const Alert = lazy(() => import('../../components/Alert'));

interface MetricCardProps {
  title: string;
  value: number | string;
  onClick?: () => void;
  navigable?: boolean;
  statusData?: StatusData[];
  entityType?: 'models' | 'vendors' | 'policies' | 'trainings' | 'vendorRisks';
  compact?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, onClick, navigable = false, statusData, entityType, compact = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  // Get status breakdown data
  const chartData = statusData || (entityType ? getDefaultStatusDistribution(entityType, typeof value === 'number' ? value : parseInt(String(value)) || 0) : []);
  const showChart = chartData.length > 0 && typeof value === 'number' && value > 0;
  
  // Get enhancements
  const distributionSummary = getDistributionSummary(chartData);
  const quickStats = getQuickStats(entityType, typeof value === 'number' ? value : parseInt(String(value)) || 0, chartData);
  const criticalInfo = hasCriticalItems(entityType, chartData);
  const priorityLevel = getPriorityLevel(entityType, typeof value === 'number' ? value : parseInt(String(value)) || 0, chartData);
  
  // Priority visual cues
  const getPriorityStyles = () => {
    switch (priorityLevel) {
      case 'high':
        return {
          borderLeft: '4px solid #EF4444',
          backgroundColor: '#FEF2F2'
        };
      case 'medium':
        return {
          borderLeft: '4px solid #F59E0B',
          backgroundColor: '#FFFBEB'
        };
      default:
        return {};
    }
  };

  return (
    <Card 
      elevation={0} 
      onClick={navigable ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={(theme) => ({
        ...cardStyles.base(theme) as any,
        ...getPriorityStyles(),
        height: '100%',
        minHeight: compact ? '90px' : 'auto',
        cursor: navigable ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': navigable 
          ? { 
              backgroundColor: '#F9FAFB',
              borderColor: '#D1D5DB',
            }
          : {}
      })}
    >
      <CardContent sx={{ 
        p: compact ? 1.5 : 2, 
        position: 'relative', 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        {/* Header section with title and arrow icon */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: compact ? 1 : 2 }}>
          <Typography 
            variant="body2" 
            sx={(theme) => ({
              color: theme.palette.text.tertiary,
              fontSize: compact ? '12px' : theme.typography.fontSize,
              fontWeight: 400
            })}
          >
            {title}
          </Typography>
          
          {navigable && (
            <Box
              sx={{
                opacity: isHovered ? 1 : 0.3,
                transition: 'opacity 0.2s ease',
              }}
            >
              <RightArrow />
            </Box>
          )}
        </Box>
        
        {/* Content section */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: compact ? 'center' : 'flex-start' }}>
          {showChart ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                <StatusDonutChart 
                  data={chartData}
                  total={typeof value === 'number' ? value : parseInt(String(value)) || 0}
                  size={60}
                />
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={(theme) => ({
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      fontSize: '1.25rem',
                      lineHeight: 1
                    })}
                  >
                    {value}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={(theme) => ({
                      color: theme.palette.text.tertiary,
                      fontSize: '11px',
                      display: 'block',
                      mt: 0.5
                    })}
                  >
                    Total
                  </Typography>
                </Box>
              </Box>
              
              {/* Distribution Summary */}
              {distributionSummary && (
                <Typography 
                  variant="caption" 
                  sx={(theme) => ({
                    color: theme.palette.text.secondary,
                    fontSize: '12px',
                    display: 'block',
                    textAlign: 'center',
                    mb: 1
                  })}
                >
                  {distributionSummary}
                </Typography>
              )}
              
              {/* Quick Stats */}
              {quickStats && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                  <Chip 
                    label={quickStats}
                    size="small"
                    sx={{
                      fontSize: '11px',
                      height: '22px',
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                      fontWeight: 500
                    }}
                  />
                </Box>
              )}
              
              {/* Quick Action Button - Bottom Right */}
              {criticalInfo.hasCritical && (
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 8, 
                  right: 8,
                  zIndex: 1
                }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(criticalInfo.actionRoute);
                    }}
                    sx={{
                      fontSize: '9px',
                      textTransform: 'none',
                      padding: '2px 6px',
                      minWidth: 'auto',
                      height: '20px',
                      borderColor: priorityLevel === 'high' ? '#EF4444' : '#F59E0B',
                      color: priorityLevel === 'high' ? '#EF4444' : '#F59E0B',
                      '&:hover': {
                        borderColor: priorityLevel === 'high' ? '#DC2626' : '#D97706',
                        backgroundColor: priorityLevel === 'high' ? '#FEF2F2' : '#FFFBEB'
                      }
                    }}
                  >
                    {criticalInfo.actionLabel}
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography 
              variant="h6" 
              sx={(theme) => ({
                fontWeight: 400,
                color: theme.palette.text.primary,
                fontSize: compact ? '1rem' : '1.25rem'
              })}
            >
              {value}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Component for stacking two compact metric cards vertically
const StackedMetricCards: React.FC<{ 
  topCard: MetricCardProps; 
  bottomCard: MetricCardProps; 
}> = ({ topCard, bottomCard }) => {
  return (
    <Stack spacing={1.5} sx={{ height: '100%', minHeight: '200px' }}>
      <Box sx={{ flex: '1 1 50%', minHeight: '90px' }}>
        <MetricCard {...topCard} compact={true} />
      </Box>
      <Box sx={{ flex: '1 1 50%', minHeight: '90px' }}>
        <MetricCard {...bottomCard} compact={true} />
      </Box>
    </Stack>
  );
};

const WorkingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { dashboard, loading, fetchDashboard } = useDashboard();
  const { evidenceMetrics, vendorRiskMetrics, vendorMetrics, usersMetrics, policyMetrics } = useDashboardMetrics();
  const { userToken } = useAuth();
  
  // State for password notification
  const [showPasswordNotification, setShowPasswordNotification] = useState(false);

  // Fetch user data to check pwd_set status
  const checkPasswordStatus = useCallback(async () => {
    if (!userToken || !userToken.id) return;

    try {
      const response = await getUserById({ userId: parseInt(userToken.id) });
      const userData = response.data || response;
      
      // Check if user has Google auth but no password set
      if (userData && userData.pwd_set === false) {
        setShowPasswordNotification(true);
      }
    } catch (error) {
      console.error('Error checking user password status:', error);
    }
  }, [userToken]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    // Check password status after component mounts
    checkPasswordStatus();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Dashboard...</Typography>
      </Box>
    );
  }

  try {
    return (
      <Box sx={{ p: 3, minHeight: '100vh' }}>
        {/* Password notification for Google auth users */}
        {showPasswordNotification && (
          <Suspense fallback={<div>Loading...</div>}>
            <Alert
              variant="warning"
              title="Set Your Password"
              body="You signed in with Google but haven't set a password yet. For account security, please set a password that you can use to access your account."
              isToast={true}
              onClick={() => {
                setShowPasswordNotification(false);
              }}
            />
          </Suspense>
        )}

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography 
            variant="h5" 
            sx={(theme) => ({
              fontWeight: 400,
              color: theme.palette.text.primary,
              fontSize: '1.5rem'
            })}
          >
            Dashboard
          </Typography>
          <Typography 
            variant="body2" 
            sx={(theme) => ({
              color: theme.palette.text.tertiary,
              fontSize: theme.typography.fontSize,
              fontWeight: 400
            })}
          >
            Overview of your AI governance platform
          </Typography>
        </Stack>

           <PageHeader
                title=""
                description=""
            />
        <Grid container spacing={3} pt={4}>    
          {/* Key Metrics Cards */}
          <Grid item xs={12}>
            <Typography 
              variant="subtitle1" 
              gutterBottom 
              sx={(theme) => ({
                fontWeight: 400,
                color: theme.palette.text.secondary,
                fontSize: theme.typography.fontSize
              })}
            >
              Key Metrics
            </Typography>
            <Grid container spacing={3}>
              {/* Stacked Simple Cards Column 1: Projects + Evidences */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <StackedMetricCards
                  topCard={{
                    title: "Projects",
                    value: dashboard?.projects || 0,
                    navigable: false
                  }}
                  bottomCard={{
                    title: "Evidences",
                    value: evidenceMetrics?.total || 0,
                    onClick: () => navigate('/file-manager'),
                    navigable: true
                  }}
                />
              </Grid>
              
              {/* Stacked Simple Cards Column 2: Reports + Users */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <StackedMetricCards
                  topCard={{
                    title: "Reports",
                    value: dashboard?.reports || 0,
                    onClick: () => navigate('/reporting'),
                    navigable: true
                  }}
                  bottomCard={{
                    title: "Users",
                    value: usersMetrics?.total || 0,
                    navigable: false
                  }}
                />
              </Grid>
              
              {/* Enhanced Cards with full height */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <MetricCard
                  title="Trainings"
                  value={dashboard?.trainings || 0}
                  onClick={() => navigate('/training')}
                  navigable={true}
                  entityType="trainings"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <MetricCard
                  title="Models"
                  value={dashboard?.models || 0}
                  onClick={() => navigate('/model-inventory')}
                  navigable={true}
                  entityType="models"
                />
              </Grid>
              {vendorRiskMetrics && (
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <MetricCard
                    title="Vendor Risks"
                    value={vendorRiskMetrics.total}
                    onClick={() => navigate('/vendors')}
                    navigable={true}
                    entityType="vendorRisks"
                  />
                </Grid>
              )}
              {vendorMetrics && (
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <MetricCard
                    title="Vendors"
                    value={vendorMetrics.total}
                    onClick={() => navigate('/vendors')}
                    navigable={true}
                    entityType="vendors"
                  />
                </Grid>
              )}
              {policyMetrics && (
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <MetricCard
                    title="Policies"
                    value={policyMetrics.total}
                    onClick={() => navigate('/policies')}
                    navigable={true}
                    entityType="policies"
                  />
                </Grid>
              )}
            </Grid>
          </Grid>

        </Grid>
      </Box>
    );
  } catch (error) {
    console.error('❌ Error in WorkingDashboard render:', error);
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Render Error: {String(error)}
        </Typography>
      </Box>
    );
  }
};

export default WorkingDashboard;