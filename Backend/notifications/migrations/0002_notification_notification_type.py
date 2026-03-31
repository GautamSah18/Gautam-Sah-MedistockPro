from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(default='general', max_length=50),
        ),
    ]
