package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaxReportService {

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Generate GSTR-1 report (Outward Supplies - Sales) for a given period.
     * GSTR-1 summarizes all outward supplies (sales) made during the period.
     */
    public Map<String, Object> generateGSTR1(String periodStart, String periodEnd) {
        long startMs = parseDateToMillis(periodStart, 0);
        long endMs = parseDateToMillis(periodEnd, 86399999);

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getDatePlaced() != null
                        && o.getDatePlaced() >= startMs
                        && o.getDatePlaced() <= endMs)
                .collect(Collectors.toList());

        // B2B (business-to-business) vs B2C (business-to-consumer) invoices
        List<Map<String, Object>> b2bInvoices = new ArrayList<>();
        List<Map<String, Object>> b2cInvoices = new ArrayList<>();

        double totalTaxableValue = 0;
        double totalTax = 0;
        double totalCgst = 0;
        double totalSgst = 0;
        double totalIgst = 0;
        double totalCess = 0;

        for (Order order : orders) {
            Map<String, Object> invoice = new HashMap<>();
            invoice.put("orderNumber", order.getOrderNumber());
            invoice.put("date", order.getDatePlaced() != null ?
                    Instant.ofEpochMilli(order.getDatePlaced()).atZone(ZoneId.systemDefault()).toLocalDate().toString() : "");
            invoice.put("customerName", order.getCustomerName());
            invoice.put("placeOfSupply", order.getDeliveryLocation());
            invoice.put("taxableValue", order.getTotalAmount() != null ? order.getTotalAmount() : 0);
            invoice.put("totalAmount", order.getTotalAmount() != null ? order.getTotalAmount() : 0);
            invoice.put("cgst", order.getCgst() != null ? order.getCgst() : 0);
            invoice.put("sgst", order.getSgst() != null ? order.getSgst() : 0);
            invoice.put("igst", order.getIgst() != null ? order.getIgst() : 0);
            invoice.put("cess", order.getCess() != null ? order.getCess() : 0);
            invoice.put("taxRate", order.getTaxRate() != null ? order.getTaxRate() : 0);
            invoice.put("status", order.getStatus());

            // Simple heuristic: if delivery location contains "Inter-State" or different state, it's IGST
            boolean isInterState = order.getIgst() != null && order.getIgst() > 0;

            if (isInterState) {
                b2bInvoices.add(invoice);
            } else {
                b2cInvoices.add(invoice);
            }

            totalTaxableValue += order.getTotalAmount() != null ? order.getTotalAmount() : 0;
            totalCgst += order.getCgst() != null ? order.getCgst() : 0;
            totalSgst += order.getSgst() != null ? order.getSgst() : 0;
            totalIgst += order.getIgst() != null ? order.getIgst() : 0;
            totalCess += order.getCess() != null ? order.getCess() : 0;
        }

        totalTax = totalCgst + totalSgst + totalIgst + totalCess;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalInvoices", orders.size());
        summary.put("b2bCount", b2bInvoices.size());
        summary.put("b2cCount", b2cInvoices.size());
        summary.put("totalTaxableValue", Math.round(totalTaxableValue * 100.0) / 100.0);
        summary.put("totalTax", Math.round(totalTax * 100.0) / 100.0);
        summary.put("totalCgst", Math.round(totalCgst * 100.0) / 100.0);
        summary.put("totalSgst", Math.round(totalSgst * 100.0) / 100.0);
        summary.put("totalIgst", Math.round(totalIgst * 100.0) / 100.0);
        summary.put("totalCess", Math.round(totalCess * 100.0) / 100.0);

        Map<String, Object> report = new HashMap<>();
        report.put("reportType", "GSTR-1");
        report.put("period", periodStart + " to " + periodEnd);
        report.put("generatedAt", new Date().toString());
        report.put("summary", summary);
        report.put("b2bInvoices", b2bInvoices);
        report.put("b2cInvoices", b2cInvoices);

        return report;
    }

    /**
     * Generate GSTR-3B report (Summary Return) for a given period.
     * GSTR-3B is a monthly summary with tax payable and input tax credit.
     */
    public Map<String, Object> generateGSTR3B(String periodStart, String periodEnd) {
        long startMs = parseDateToMillis(periodStart, 0);
        long endMs = parseDateToMillis(periodEnd, 86399999);

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getDatePlaced() != null
                        && o.getDatePlaced() >= startMs
                        && o.getDatePlaced() <= endMs)
                .collect(Collectors.toList());

        // 3.1 Outward Supplies (Sales)
        double outwardSupplies = 0;
        double outwardTaxable = 0;
        double outwardCgst = 0;
        double outwardSgst = 0;
        double outwardIgst = 0;
        double outwardCess = 0;

        // Tax rate wise breakups
        Map<Double, Map<String, Double>> taxRateBreakdown = new TreeMap<>();

        for (Order order : orders) {
            if (order.getTotalAmount() == null) continue;
            double rate = order.getTaxRate() != null ? order.getTaxRate() : 18.0;

            outwardSupplies += order.getTotalAmount();
            outwardTaxable += order.getTotalAmount();
            outwardCgst += order.getCgst() != null ? order.getCgst() : 0;
            outwardSgst += order.getSgst() != null ? order.getSgst() : 0;
            outwardIgst += order.getIgst() != null ? order.getIgst() : 0;
            outwardCess += order.getCess() != null ? order.getCess() : 0;

            taxRateBreakdown.computeIfAbsent(rate, k -> {
                Map<String, Double> m = new HashMap<>();
                m.put("taxableValue", 0.0);
                m.put("cgst", 0.0);
                m.put("sgst", 0.0);
                m.put("igst", 0.0);
                m.put("cess", 0.0);
                m.put("totalTax", 0.0);
                return m;
            });

            Map<String, Double> breakdown = taxRateBreakdown.get(rate);
            breakdown.put("taxableValue", breakdown.get("taxableValue") + order.getTotalAmount());
            breakdown.put("cgst", breakdown.get("cgst") + (order.getCgst() != null ? order.getCgst() : 0));
            breakdown.put("sgst", breakdown.get("sgst") + (order.getSgst() != null ? order.getSgst() : 0));
            breakdown.put("igst", breakdown.get("igst") + (order.getIgst() != null ? order.getIgst() : 0));
            breakdown.put("cess", breakdown.get("cess") + (order.getCess() != null ? order.getCess() : 0));
            double totalTax = (order.getCgst() != null ? order.getCgst() : 0)
                    + (order.getSgst() != null ? order.getSgst() : 0)
                    + (order.getIgst() != null ? order.getIgst() : 0)
                    + (order.getCess() != null ? order.getCess() : 0);
            breakdown.put("totalTax", breakdown.get("totalTax") + totalTax);
        }

        // Tax rate wise summary for table
        List<Map<String, Object>> rateWiseSummary = new ArrayList<>();
        for (Map.Entry<Double, Map<String, Double>> entry : taxRateBreakdown.entrySet()) {
            Map<String, Object> row = new HashMap<>();
            row.put("rate", entry.getKey());
            row.put("taxableValue", Math.round(entry.getValue().get("taxableValue") * 100.0) / 100.0);
            row.put("cgst", Math.round(entry.getValue().get("cgst") * 100.0) / 100.0);
            row.put("sgst", Math.round(entry.getValue().get("sgst") * 100.0) / 100.0);
            row.put("igst", Math.round(entry.getValue().get("igst") * 100.0) / 100.0);
            row.put("cess", Math.round(entry.getValue().get("cess") * 100.0) / 100.0);
            row.put("totalTax", Math.round(entry.getValue().get("totalTax") * 100.0) / 100.0);
            rateWiseSummary.add(row);
        }

        // Compute total tax payable
        double totalOutwardTax = outwardCgst + outwardSgst + outwardIgst + outwardCess;

        Map<String, Object> summary = new HashMap<>();
        summary.put("outwardSupplies", Math.round(outwardSupplies * 100.0) / 100.0);
        summary.put("outwardTaxableValue", Math.round(outwardTaxable * 100.0) / 100.0);
        summary.put("outwardCgst", Math.round(outwardCgst * 100.0) / 100.0);
        summary.put("outwardSgst", Math.round(outwardSgst * 100.0) / 100.0);
        summary.put("outwardIgst", Math.round(outwardIgst * 100.0) / 100.0);
        summary.put("outwardCess", Math.round(outwardCess * 100.0) / 100.0);
        summary.put("totalTaxPayable", Math.round(totalOutwardTax * 100.0) / 100.0);

        Map<String, Object> report = new HashMap<>();
        report.put("reportType", "GSTR-3B");
        report.put("period", periodStart + " to " + periodEnd);
        report.put("generatedAt", new Date().toString());
        report.put("summary", summary);
        report.put("rateWiseSummary", rateWiseSummary);
        report.put("totalOrders", orders.size());

        return report;
    }

    /**
     * Generate a combined tax dashboard with period-over-period comparison.
     */
    public Map<String, Object> getTaxDashboard() {
        // Current month
        LocalDate now = LocalDate.now();
        String currentMonthStart = now.withDayOfMonth(1).toString();
        String currentMonthEnd = now.toString();

        // Previous month
        LocalDate prevMonth = now.minusMonths(1);
        String prevMonthStart = prevMonth.withDayOfMonth(1).toString();
        String prevMonthEnd = prevMonth.withDayOfMonth(prevMonth.lengthOfMonth()).toString();

        Map<String, Object> current = generateGSTR3B(currentMonthStart, currentMonthEnd);
        Map<String, Object> previous = generateGSTR3B(prevMonthStart, prevMonthEnd);

        Map<String, Object> currentSummary = (Map<String, Object>) current.get("summary");
        Map<String, Object> previousSummary = (Map<String, Object>) previous.get("summary");

        double currentTax = (double) currentSummary.get("totalTaxPayable");
        double previousTax = (double) previousSummary.get("totalTaxPayable");
        double taxGrowth = previousTax > 0 ? ((currentTax - previousTax) / previousTax) * 100 : 0;

        double currentRevenue = (double) currentSummary.get("outwardSupplies");
        double previousRevenue = (double) previousSummary.get("outwardSupplies");
        double revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

        // Year-to-date totals
        String ytdStart = now.withMonth(1).withDayOfMonth(1).toString();
        Map<String, Object> ytdReport = generateGSTR3B(ytdStart, currentMonthEnd);
        Map<String, Object> ytdSummary = (Map<String, Object>) ytdReport.get("summary");

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("currentPeriod", currentMonthStart + " to " + currentMonthEnd);
        dashboard.put("previousPeriod", prevMonthStart + " to " + prevMonthEnd);
        dashboard.put("currentTaxPayable", currentTax);
        dashboard.put("previousTaxPayable", previousTax);
        dashboard.put("taxGrowth", Math.round(taxGrowth * 10.0) / 10.0);
        dashboard.put("currentRevenue", currentRevenue);
        dashboard.put("previousRevenue", previousRevenue);
        dashboard.put("revenueGrowth", Math.round(revenueGrowth * 10.0) / 10.0);
        dashboard.put("ytdTaxPayable", ytdSummary.get("totalTaxPayable"));
        dashboard.put("ytdRevenue", ytdSummary.get("outwardSupplies"));
        dashboard.put("currentMonthData", current);
        dashboard.put("previousMonthData", previous);
        dashboard.put("ytdData", ytdReport);

        return dashboard;
    }

    /**
     * Export report as CSV string.
     */
    public String exportReportAsCsv(String type, String periodStart, String periodEnd) {
        Map<String, Object> report;
        if ("GSTR-1".equalsIgnoreCase(type)) {
            report = generateGSTR1(periodStart, periodEnd);
        } else {
            report = generateGSTR3B(periodStart, periodEnd);
        }

        StringBuilder csv = new StringBuilder();
        csv.append("Report Type,").append(report.get("reportType")).append("\n");
        csv.append("Period,").append(report.get("period")).append("\n");
        csv.append("Generated At,").append(report.get("generatedAt")).append("\n\n");

        Map<String, Object> summary = (Map<String, Object>) report.get("summary");
        csv.append("Summary\n");
        for (Map.Entry<String, Object> entry : summary.entrySet()) {
            csv.append(entry.getKey()).append(",").append(entry.getValue()).append("\n");
        }

        csv.append("\nRate Wise Breakup\n");
        csv.append("Rate,Taxable Value,CGST,SGST,IGST,CESS,Total Tax\n");
        List<Map<String, Object>> rateWise = (List<Map<String, Object>>) report.getOrDefault("rateWiseSummary", new ArrayList<>());
        for (Map<String, Object> row : rateWise) {
            csv.append(row.get("rate")).append(",")
                .append(row.get("taxableValue")).append(",")
                .append(row.get("cgst")).append(",")
                .append(row.get("sgst")).append(",")
                .append(row.get("igst")).append(",")
                .append(row.get("cess")).append(",")
                .append(row.get("totalTax")).append("\n");
        }

        return csv.toString();
    }

    private long parseDateToMillis(String dateStr, long defaultOffsetMs) {
        try {
            LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_DATE);
            return date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli() + defaultOffsetMs;
        } catch (Exception e) {
            // Fallback: return current month start
            return LocalDate.now().withDayOfMonth(1)
                    .atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
        }
    }
}
