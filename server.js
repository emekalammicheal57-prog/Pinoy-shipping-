const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = 'your-secret-key-here';

// Professional shipping data structure
let shipments = [
  {
    id: 'PH2024001',
    trackingNumber: 'PH123456789',
    status: 'customs_hold',
    customer: {
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      phone: '+639123456789',
      address: '123 Rizal Avenue, Manila, Philippines 1000'
    },
    package: {
      description: 'iPhone 15 Pro & Accessories',
      weight: '2.5kg',
      dimensions: '30x20x15cm',
      value: '₱65,000',
      category: 'Electronics',
      insurance: '₱5,000'
    },
    shipping: {
      service: 'Express Delivery',
      cost: '₱450',
      estimatedDelivery: '2024-01-20',
      pickupDate: '2024-01-15',
      carrier: 'Pinoy Express'
    },
    currentLocation: {
      lat: 14.5995,
      lng: 120.9842,
      name: 'Manila Customs Office',
      address: 'Port Area, Manila'
    },
    history: [
      {
        status: 'order_placed',
        timestamp: new Date('2024-01-14T10:00:00'),
        location: 'Online Store',
        description: 'Order received and processing'
      },
      {
        status: 'picked_up',
        timestamp: new Date('2024-01-15T09:30:00'),
        location: 'Makati Sorting Center',
        description: 'Package collected by courier'
      },
      {
        status: 'in_transit',
        timestamp: new Date('2024-01-15T14:20:00'),
        location: 'Manila Distribution Hub',
        description: 'In transit to destination'
      },
      {
        status: 'customs_hold',
        timestamp: new Date('2024-01-16T11:15:00'),
        location: 'Manila Customs',
        description: 'Customs inspection required'
      }
    ],
    customsInfo: {
      queuePosition: 3,
      estimatedClearance: '2024-01-18',
      requiredDocuments: ['Commercial Invoice', 'Valid ID Copy', 'Proof of Payment'],
      customsOfficer: 'Officer Rodriguez',
      contact: '+6328523-8484',
      notes: 'Electronic goods require additional documentation'
    },
    support: {
      liveChat: true,
      lastUpdate: new Date(),
      assignedAgent: 'Customer Support Team'
    }
  },
  {
    id: 'PH2024002',
    trackingNumber: 'PH987654321',
    status: 'out_for_delivery',
    customer: {
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@email.com',
      phone: '+639987654321',
      address: '456 Quezon Boulevard, Quezon City 1100'
    },
    package: {
      description: 'Important Business Documents',
      weight: '1.2kg',
      dimensions: '40x30x5cm',
      value: '₱15,000',
      category: 'Documents',
      insurance: '₱2,000'
    },
    shipping: {
      service: 'Priority Mail',
      cost: '₱280',
      estimatedDelivery: '2024-01-17',
      pickupDate: '2024-01-14',
      carrier: 'Pinoy Express'
    },
    currentLocation: {
      lat: 14.6760,
      lng: 121.0437,
      name: 'Quezon City Delivery Route',
      address: 'Near SM North EDSA'
    },
    history: [
      {
        status: 'order_placed',
        timestamp: new Date('2024-01-13T15:20:00'),
        location: 'Corporate Office',
        description: 'Business documents shipment'
      },
      {
        status: 'picked_up',
        timestamp: new Date('2024-01-14T10:45:00'),
        location: 'Ortigas Center',
        description: 'Documents collected'
      },
      {
        status: 'in_transit',
        timestamp: new Date('2024-01-15T08:30:00'),
        location: 'Metro Manila Network',
        description: 'Processing for delivery'
      },
      {
        status: 'out_for_delivery',
        timestamp: new Date('2024-01-17T07:15:00'),
        location: 'Quezon City Area',
        description: 'With delivery rider - ETA: 2-4 PM'
      }
    ],
    customsInfo: null,
    support: {
      liveChat: false,
      lastUpdate: new Date(),
      assignedAgent: null
    }
  }
];

// Admin users
const adminUsers = [
  {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('pinoyexpress2024', 10),
    role: 'superadmin',
    name: 'System Administrator'
  },
  {
    id: 2,
    username: 'support',
    password: bcrypt.hashSync('support123', 10),
    role: 'support',
    name: 'Support Agent'
  }
];

// Serve main customer website
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pinoy Express Shipping - Track Your Package</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --primary-blue: #0038a8;
            --primary-red: #ce1126;
            --accent-yellow: #fcd116;
            --dark-blue: #00247d;
            --success: #28a745;
            --warning: #ffc107;
            --danger: #dc3545;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, var(--primary-blue) 0%, var(--dark-blue) 100%);
            min-height: 100vh;
            color: #333;
            line-height: 1.6;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            padding: 1rem 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 2rem;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary-blue);
        }
        
        .nav-links {
            display: flex;
            gap: 2rem;
            list-style: none;
        }
        
        .nav-links a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
            transition: color 0.3s;
        }
        
        .nav-links a:hover {
            color: var(--primary-blue);
        }
        
        .hero {
            text-align: center;
            color: white;
            padding: 4rem 2rem;
        }
        
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        .hero p {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 2rem;
        }
        
        .tracking-section {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .tracking-input-group {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .tracking-input {
            flex: 1;
            padding: 1rem;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 1rem;
        }
        
        .tracking-input:focus {
            outline: none;
            border-color: var(--primary-blue);
        }
        
        .btn {
            background: var(--primary-blue);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .btn:hover {
            background: var(--primary-red);
            transform: translateY(-2px);
        }
        
        .demo-section {
            background: rgba(252, 209, 22, 0.1);
            border: 2px dashed var(--accent-yellow);
            border-radius: 10px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .demo-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .demo-btn {
            background: var(--accent-yellow);
            color: #333;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .status-timeline {
            display: flex;
            justify-content: space-between;
            margin: 3rem 0;
            position: relative;
        }
        
        .status-timeline::before {
            content: '';
            position: absolute;
            top: 25px;
            left: 10%;
            right: 10%;
            height: 4px;
            background: #e0e0e0;
            z-index: 1;
        }
        
        .status-step {
            text-align: center;
            position: relative;
            z-index: 2;
            flex: 1;
        }
        
        .status-bubble {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #e0e0e0;
            margin: 0 auto 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            border: 3px solid white;
            transition: all 0.3s;
        }
        
        .status-step.active .status-bubble {
            background: var(--success);
            color: white;
            transform: scale(1.1);
        }
        
        .status-step.completed .status-bubble {
            background: var(--primary-blue);
            color: white;
        }
        
        .customs-alert {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 3px solid var(--warning);
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 0;
        }
        
        .package-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin: 2rem 0;
        }
        
        .detail-card {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 10px;
            border-left: 4px solid var(--primary-blue);
        }
        
        .jivo-chat {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary-blue);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 25px;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        
        .admin-link {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-yellow);
            color: #333;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            text-decoration: none;
            font-weight: 500;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <!-- JivoChat Widget -->
    <script src="//code.jivosite.com/widget/abc123" async></script>
    
    <a href="/admin" class="admin-link">
        <i class="fas fa-cog"></i> Admin Portal
    </a>

    <header class="header">
        <nav class="nav-container">
            <div class="logo">
                <i class="fas fa-shipping-fast"></i>
                Pinoy Express Shipping
            </div>
            <ul class="nav-links">
                <li><a href="#">Track Package</a></li>
                <li><a href="#">Services</a></li>
                <li><a href="#">Locations</a></li>
                <li><a href="#">Support</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero">
        <h1>Track Your Package</h1>
        <p>Real-time tracking for shipments across the Philippines</p>
    </section>

    <section class="tracking-section">
        <div class="demo-section">
            <p><strong>Try our demo tracking numbers:</strong></p>
            <div class="demo-buttons">
                <button class="demo-btn" onclick="useDemo('PH123456789')">
                    <i class="fas fa-ship"></i> Customs Hold Example
                </button>
                <button class="demo-btn" onclick="useDemo('PH987654321')">
                    <i class="fas fa-truck"></i> Out for Delivery
                </button>
            </div>
        </div>

        <div class="tracking-input-group">
            <input type="text" class="tracking-input" id="trackingInput" 
                   placeholder="Enter your tracking number (e.g., PH123456789)">
            <button class="btn" onclick="trackPackage()">
                <i class="fas fa-search"></i> Track Package
            </button>
        </div>

        <div id="trackingResult">
            <div style="text-align: center; color: #666; padding: 2rem;">
                <i class="fas fa-box-open" style="font-size: 3rem; color: #0038a8; margin-bottom: 1rem;"></i>
                <h3>Enter Tracking Number</h3>
                <p>Track your package with real-time updates across the Philippines</p>
            </div>
        </div>
    </section>

    <!-- JivoChat Floating Button -->
    <div class="jivo-chat" onclick="openJivoChat()">
        <i class="fas fa-comments"></i> Live Support
    </div>

    <script>
        function useDemo(trackingNumber) {
            document.getElementById('trackingInput').value = trackingNumber;
            trackPackage();
        }

        async function trackPackage() {
            const trackingNumber = document.getElementById('trackingInput').value.trim();
            const resultDiv = document.getElementById('trackingResult');
            
            if (!trackingNumber) {
                showError('Please enter a tracking number');
                return;
            }
            
            showLoading();
            
            try {
                const response = await fetch('/api/track/' + trackingNumber);
                const data = await response.json();
                
                if (data.success) {
                    displayTrackingInfo(data.shipment);
                } else {
                    showError(data.error);
                }
            } catch (error) {
                showError('Failed to track package. Please try again.');
            }
        }

        function displayTrackingInfo(shipment) {
            const statusSteps = [
                'order_placed', 'picked_up', 'in_transit', 
                'customs_hold', 'out_for_delivery', 'delivered'
            ];
            
            const statusLabels = {
                order_placed: 'Order Placed',
                picked_up: 'Picked Up',
                in_transit: 'In Transit',
                customs_hold: 'Customs Hold',
                out_for_delivery: 'Out for Delivery',
                delivered: 'Delivered'
            };
            
            let timelineHTML = '<div class="status-timeline">';
            statusSteps.forEach((step, index) => {
                const isActive = shipment.status === step;
                const isCompleted = statusSteps.indexOf(shipment.status) > index;
                
                timelineHTML += \`
                    <div class="status-step \${isActive ? 'active' : ''} \${isCompleted ? 'completed' : ''}">
                        <div class="status-bubble">\${index + 1}</div>
                        <div>\${statusLabels[step]}</div>
                    </div>
                \`;
            });
            timelineHTML += '</div>';
            
            let customsHTML = '';
            if (shipment.status === 'customs_hold' && shipment.customsInfo) {
                customsHTML = \`
                    <div class="customs-alert">
                        <h3><i class="fas fa-exclamation-triangle"></i> Customs Hold - Action Required</h3>
                        <p>Your package is being held by Philippine Customs for inspection.</p>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;">
                            <div>
                                <strong>Queue Position:</strong><br>
                                <span style="font-size: 1.5rem; color: var(--primary-red);">\${shipment.customsInfo.queuePosition}</span>
                            </div>
                            <div>
                                <strong>Estimated Clearance:</strong><br>
                                \${new Date(shipment.customsInfo.estimatedClearance).toLocaleDateString('en-PH')}
                            </div>
                        </div>
                        
                        <div style="margin: 1rem 0;">
                            <strong>Required Documents:</strong>
                            <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                                \${shipment.customsInfo.requiredDocuments.map(doc => '<li>' + doc + '</li>').join('')}
                            </ul>
                        </div>
                        
                        <button class="btn" style="background: var(--warning); color: #333;" 
                                onclick="openJivoChat()">
                            <i class="fas fa-headset"></i> Contact Customs Support
                        </button>
                    </div>
                \`;
            }
            
            const packageDetailsHTML = \`
                <div class="package-details">
                    <div class="detail-card">
                        <h4><i class="fas fa-user"></i> Customer Information</h4>
                        <p><strong>Name:</strong> \${shipment.customer.name}</p>
                        <p><strong>Phone:</strong> \${shipment.customer.phone}</p>
                        <p><strong>Address:</strong> \${shipment.customer.address}</p>
                    </div>
                    
                    <div class="detail-card">
                        <h4><i class="fas fa-box"></i> Package Details</h4>
                        <p><strong>Description:</strong> \${shipment.package.description}</p>
                        <p><strong>Weight:</strong> \${shipment.package.weight}</p>
                        <p><strong>Value:</strong> \${shipment.package.value}</p>
                    </div>
                </div>
            \`;
            
            const resultDiv = document.getElementById('trackingResult');
            resultDiv.innerHTML = \`
                <div>
                    <h2 style="color: var(--primary-blue); margin-bottom: 1rem;">
                        <i class="fas fa-shipping-fast"></i> Tracking Results
                    </h2>
                    
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem;">
                        <p><strong>Tracking Number:</strong> \${shipment.trackingNumber}</p>
                        <p><strong>Current Status:</strong> \${statusLabels[shipment.status]}</p>
                        <p><strong>Current Location:</strong> \${shipment.currentLocation.name}</p>
                        <p><strong>Last Update:</strong> \${new Date(shipment.history[shipment.history.length-1].timestamp).toLocaleString('en-PH')}</p>
                    </div>
                    
                    \${timelineHTML}
                    \${customsHTML}
                    \${packageDetails
