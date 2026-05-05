'use client';

import { useState, useEffect } from 'react';
import TopNav from '@/components/TopNav';
import styles from './Orders.module.css';
import { Download, PlayCircle, CheckCircle2, X } from 'lucide-react';

type Order = {
  id: string;
  query: string;
  leads: number;
  status: string;
  date: string;
  data?: any[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Cache busting: ensure we always fetch the most recent data from the server
        const response = await fetch(`/api/orders?t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const downloadCSV = (order: Order) => {
    if (!order.data || order.data.length === 0) return;

    const headers = Object.keys(order.data[0]).join(',');
    const rows = order.data.map(row =>
      Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${order.query.replace(/\s+/g, '_')}_leads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // UI Cleanup: close modal on mobile devices after download initiated
    if (isMobile) setSelectedOrder(null);
  };

  return (
    <>
      <TopNav title="Orders" />

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.fullLoading}>
            <div className={styles.spinner}></div>
            <h3>Syncing Scrape History</h3>
            <p>Fetching your latest B2B leads from Supabase...</p>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.titleGroup}>
                <h2>Order History</h2>
                <p className={styles.subtitle}>View your past scrape results, download CSV exports, and manage your lead lists.</p>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.hideMobileJobId}>JOB ID</th>
                    <th>SEARCH NAME</th>
                    <th>DATE</th>
                    <th>TOTAL LEADS</th>
                    <th className={styles.hideMobile}>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyCell}>
                        <div className={styles.emptyState}>
                          <PlayCircle size={40} opacity={0.2} />
                          <p>No scrape history found.</p>
                          <small>Start your first lead generation job to see it here.</small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      return (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={selectedOrder?.id === order.id ? styles.selectedRow : ''}
                        >
                          <td className={`${styles.cellId} ${styles.hideMobileJobId}`}>{order.id}</td>
                          <td className={styles.cellQuery}>{order.query}</td>
                          <td className={styles.cellDate}>{order.date}</td>
                          <td className={styles.cellLeads}>{order.leads}</td>
                          <td className={styles.hideMobile}>
                            <span className={`${styles.status} ${order.status === 'Completed' ? styles.statusCompleted : styles.statusRunning}`}>
                              <div className={styles.statusDot}></div>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionsCell}>
                              <button
                                className={styles.actionBtn}
                                disabled={order.status !== 'Completed'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadCSV(order);
                                }}
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Mobile Quick Action Modal */}
      {isMobile && selectedOrder && (
        <div className={styles.mobileModalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.mobileModal} onClick={e => e.stopPropagation()}>
            <div className={styles.mobileModalHeader}>
              <h3>{selectedOrder.query}</h3>
              <p>{selectedOrder.leads} leads found</p>
            </div>
            <div className={styles.mobileModalActions}>
              <button 
                className={styles.mobileDownloadBtn}
                onClick={() => downloadCSV(selectedOrder)}
                disabled={selectedOrder.status !== 'Completed'}
              >
                <Download size={20} />
                Download CSV
              </button>
              <button 
                className={styles.mobileCloseBtn}
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Slide-out Panel (Only for non-mobile) */}
      {!isMobile && (
        <div className={`${styles.slidePanel} ${selectedOrder ? styles.slidePanelOpen : ''}`}>
          {selectedOrder && (
            <>
              <div className={styles.panelHeader}>
                <h3>Order Details</h3>
                <button className={styles.closeBtn} onClick={() => setSelectedOrder(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.panelContent}>
                <div className={styles.panelSection}>
                  <p className={styles.panelLabel}>Job ID</p>
                  <p className={styles.panelValue}>{selectedOrder.id}</p>
                </div>
                <div className={styles.panelSection}>
                  <p className={styles.panelLabel}>Query</p>
                  <p className={styles.panelValue}>{selectedOrder.query}</p>
                </div>
                <div className={styles.panelSection}>
                  <p className={styles.panelLabel}>Status</p>
                  <span className={`${styles.status} ${selectedOrder.status === 'Completed' ? styles.statusCompleted : styles.statusRunning}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className={styles.panelSection}>
                  <p className={styles.panelLabel}>Total Leads Found</p>
                  <p className={styles.panelValue}>{selectedOrder.leads}</p>
                </div>

                {selectedOrder.status === 'Completed' && (
                  <button
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '24px' }}
                    onClick={() => downloadCSV(selectedOrder)}
                  >
                    <Download size={16} />
                    Download CSV
                  </button>
                )}

                {selectedOrder.data && selectedOrder.data.length > 0 && (
                  <div className={styles.previewSection}>
                    <p className={styles.panelLabel}>Preview (First Lead)</p>
                    <pre className={styles.previewData}>
                      {JSON.stringify(selectedOrder.data[0], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
