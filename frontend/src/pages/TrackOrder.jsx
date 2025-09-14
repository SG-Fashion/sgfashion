// src/pages/TrackOrder.jsx
import React, { useContext, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ShopContext } from "../context/ShopContext"
import axios from "axios"

const TrackOrder = () => {
  const { backendUrl, token } = useContext(ShopContext)
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Map each status to an index (to highlight steps)
  const STATUS_STEPS = [
    "Order Placed",
    "Packing",
    "Shipped",
    "Out for delivery",
    "Delivered",
  ]
  // (the order of this array must match exactly how you named statuses)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!token) {
          setError("You must be logged in.")
          setLoading(false)
          return
        }
        const response = await axios.get(
          `${backendUrl}/api/order/${orderId}`,
          { headers: { token } }
        )
        if (response.data.success) {
          setOrder(response.data.order)
        } else {
          setError(response.data.message || "Failed to load order.")
        }
      } catch (err) {
        console.error(err)
        setError("Server error while fetching order.")
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId, backendUrl, token])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading order status...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-500 text-center">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    )
  }

  // Determine which index in STATUS_STEPS matches order.status
  const currentStepIndex = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Track Your Order</h2>

      {/* 5-step horizontal tracker */}
      <div className="flex justify-between items-center mb-8">
        {STATUS_STEPS.map((stepLabel, idx) => {
          const isCompleted = idx <= currentStepIndex
          return (
            <div key={stepLabel} className="flex-1 flex flex-col items-center">
              {/* circle */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${isCompleted ? "bg-green-500 text-white" : "border-2 border-gray-300 text-gray-500"}
                `}
              >
                {idx + 1}
              </div>

              {/* label */}
              <p
                className={`mt-2 text-center text-xs ${
                  isCompleted ? "text-green-600 font-medium" : "text-gray-500"
                }`}
              >
                {stepLabel}
              </p>

              {/* horizontal line (except after last) */}
              {idx < STATUS_STEPS.length - 1 && (
                <div
                  className={`
                    h-1 flex-1
                    ${idx < currentStepIndex ? "bg-green-500" : "bg-gray-300"}
                  `}
                  style={{ width: "100%", marginTop: "-0.5rem", marginLeft: "4rem" }}
                ></div>
              )}
            </div>
          )
        })}
      </div>

      {/* If trackingUrl exists and status is at least "Shipped" (i.e. idx >= 2) */}
      {currentStepIndex >= 2 && order.trackingUrl && (
        <div className="text-center mt-6">
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700"
          >
            Go to Tracking Link
          </a>
        </div>
      )}

      {/* If status is before “Shipped”, show a message instead */}
      {currentStepIndex < 2 && (
        <p className="text-center text-gray-600 mt-6">
          Your order is still <span className="font-semibold">{order.status}</span>.
          Tracking will be available once the package is shipped.
        </p>
      )}

      {/* Always show a “Back to Orders” button */}
      <div className="text-center mt-8">
        <button
          onClick={() => navigate("/orders")}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Back to My Orders
        </button>
      </div>
    </div>
  )
}

export default TrackOrder
