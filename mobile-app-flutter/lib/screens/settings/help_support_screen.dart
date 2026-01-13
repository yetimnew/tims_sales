import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  Future<void> _launchEmail(String email) async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: email,
      query: 'subject=TIMS Driver App Support Request',
    );
    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    }
  }

  Future<void> _launchPhone(String phone) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help & Support')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // FAQ Section
          _buildSectionHeader('Frequently Asked Questions'),
          _buildFAQItem(
            context,
            question: 'How do I update my trip status?',
            answer: 'Navigate to the Trips tab, select your active trip, and tap "Update Status". Choose the appropriate status from the options provided.',
          ),
          _buildFAQItem(
            context,
            question: 'How do I track my location?',
            answer: 'Go to Location Tracking from the dashboard. Enable background tracking to automatically share your location during trips.',
          ),
          _buildFAQItem(
            context,
            question: 'How do I record fuel purchases?',
            answer: 'Go to Fuel Tracking from the dashboard, tap the "+" button, fill in the fuel details, and submit. You can also upload a receipt photo.',
          ),
          _buildFAQItem(
            context,
            question: 'What should I do in case of emergency?',
            answer: 'Tap the Emergency button in the dashboard. This will send your current location and an alert to dispatchers immediately.',
          ),
          _buildFAQItem(
            context,
            question: 'How do I view my performance?',
            answer: 'Go to the Performance tab to see your latest scores, performance breakdown, and historical data.',
          ),
          const SizedBox(height: 32),

          // Contact Support Section
          _buildSectionHeader('Contact Support'),
          _buildContactTile(
            context,
            icon: Icons.email,
            title: 'Email Support',
            subtitle: 'support@tims.com',
            onTap: () => _launchEmail('support@tims.com'),
          ),
          const SizedBox(height: 8),
          _buildContactTile(
            context,
            icon: Icons.phone,
            title: 'Phone Support',
            subtitle: '+251 11 XXX XXXX',
            onTap: () => _launchPhone('+251111234567'),
          ),
          const SizedBox(height: 32),

          // Quick Links Section
          _buildSectionHeader('Quick Links'),
          _buildLinkTile(
            context,
            icon: Icons.book_outlined,
            title: 'User Guide',
            subtitle: 'Learn how to use the app',
            onTap: () {
              // TODO: Open user guide
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('User guide coming soon')),
              );
            },
          ),
          const SizedBox(height: 8),
          _buildLinkTile(
            context,
            icon: Icons.video_library_outlined,
            title: 'Video Tutorials',
            subtitle: 'Watch step-by-step tutorials',
            onTap: () {
              // TODO: Open video tutorials
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Video tutorials coming soon')),
              );
            },
          ),
          const SizedBox(height: 32),

          // App Info Section
          _buildSectionHeader('App Information'),
          _buildInfoTile(
            context,
            icon: Icons.bug_report,
            title: 'Report a Bug',
            subtitle: 'Found an issue? Let us know',
            onTap: () => _launchEmail('bugs@tims.com'),
          ),
          const SizedBox(height: 8),
          _buildInfoTile(
            context,
            icon: Icons.lightbulb_outline,
            title: 'Suggest a Feature',
            subtitle: 'Have an idea? Share it with us',
            onTap: () => _launchEmail('feedback@tims.com'),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.grey[600],
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildFAQItem(BuildContext context, {required String question, required String answer}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ExpansionTile(
        title: Text(
          question,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              answer,
              style: TextStyle(color: Colors.grey[700], height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactTile(BuildContext context, {required IconData icon, required String title, required String subtitle, required VoidCallback onTap}) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: Theme.of(context).primaryColor),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  Widget _buildLinkTile(BuildContext context, {required IconData icon, required String title, required String subtitle, required VoidCallback onTap}) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: Theme.of(context).primaryColor),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  Widget _buildInfoTile(BuildContext context, {required IconData icon, required String title, required String subtitle, required VoidCallback onTap}) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: Theme.of(context).primaryColor),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}

